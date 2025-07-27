"""
エラーアラートサービス
"""
import asyncio
import smtplib
import json
from email.mime.text import MimeText
from email.mime.multipart import MimeMultipart
from typing import List, Dict, Any, Optional, Callable
from datetime import datetime, timedelta
from dataclasses import dataclass
from enum import Enum

from .models import ErrorReport, ErrorSeverity, ErrorCategory
from .service import error_monitoring_service
from core.logger import get_logger, LogCategory

logger = get_logger(__name__)

class AlertChannel(Enum):
    EMAIL = "email"
    WEBHOOK = "webhook"
    CONSOLE = "console"

@dataclass
class AlertRule:
    id: str
    name: str
    description: str
    severity_threshold: ErrorSeverity
    error_count_threshold: int
    time_window_minutes: int
    categories: List[ErrorCategory]
    channels: List[AlertChannel]
    enabled: bool = True
    cooldown_minutes: int = 30

@dataclass
class AlertConfig:
    smtp_host: str = "localhost"
    smtp_port: int = 587
    smtp_username: str = ""
    smtp_password: str = ""
    smtp_use_tls: bool = True
    from_email: str = "alerts@todo-app.com"
    to_emails: List[str] = None
    webhook_url: str = ""
    webhook_headers: Dict[str, str] = None

    def __post_init__(self):
        if self.to_emails is None:
            self.to_emails = []
        if self.webhook_headers is None:
            self.webhook_headers = {}

@dataclass
class Alert:
    id: str
    rule_id: str
    rule_name: str
    triggered_at: datetime
    message: str
    severity: ErrorSeverity
    error_count: int
    affected_errors: List[str]  # error report IDs
    channels_sent: List[AlertChannel]
    acknowledged: bool = False
    acknowledged_by: Optional[str] = None
    acknowledged_at: Optional[datetime] = None

class AlertService:
    """
    エラーアラートサービス
    """
    
    def __init__(self, config: AlertConfig = None):
        self.config = config or AlertConfig()
        self.rules: Dict[str, AlertRule] = {}
        self.active_alerts: Dict[str, Alert] = {}
        self.alert_history: List[Alert] = []
        self.last_rule_check: Dict[str, datetime] = {}
        self.alert_callbacks: List[Callable[[Alert], None]] = []
        
        # デフォルトルールを設定
        self._setup_default_rules()
        
        logger.info("Alert service initialized", category=LogCategory.SYSTEM)
    
    def _setup_default_rules(self):
        """デフォルトアラートルールを設定"""
        
        # クリティカルエラールール
        self.add_rule(AlertRule(
            id="critical_errors",
            name="Critical Errors",
            description="Critical severity errors detected",
            severity_threshold=ErrorSeverity.CRITICAL,
            error_count_threshold=1,
            time_window_minutes=5,
            categories=list(ErrorCategory),
            channels=[AlertChannel.EMAIL, AlertChannel.WEBHOOK, AlertChannel.CONSOLE],
            cooldown_minutes=15
        ))
        
        # 高頻度エラールール
        self.add_rule(AlertRule(
            id="high_frequency_errors",
            name="High Frequency Errors",
            description="High frequency of errors detected",
            severity_threshold=ErrorSeverity.MEDIUM,
            error_count_threshold=10,
            time_window_minutes=10,
            categories=list(ErrorCategory),
            channels=[AlertChannel.EMAIL, AlertChannel.CONSOLE],
            cooldown_minutes=30
        ))
        
        # API エラールール
        self.add_rule(AlertRule(
            id="api_errors",
            name="API Errors",
            description="API related errors",
            severity_threshold=ErrorSeverity.HIGH,
            error_count_threshold=5,
            time_window_minutes=5,
            categories=[ErrorCategory.API, ErrorCategory.NETWORK],
            channels=[AlertChannel.EMAIL, AlertChannel.WEBHOOK],
            cooldown_minutes=20
        ))
        
        # セキュリティアラート
        self.add_rule(AlertRule(
            id="security_alerts",
            name="Security Alerts",
            description="Security related incidents",
            severity_threshold=ErrorSeverity.HIGH,
            error_count_threshold=3,
            time_window_minutes=15,
            categories=[ErrorCategory.AUTHENTICATION, ErrorCategory.AUTHORIZATION],
            channels=[AlertChannel.EMAIL, AlertChannel.WEBHOOK, AlertChannel.CONSOLE],
            cooldown_minutes=10
        ))
    
    def add_rule(self, rule: AlertRule):
        """アラートルールを追加"""
        self.rules[rule.id] = rule
        logger.info(f"Alert rule added: {rule.name}", category=LogCategory.SYSTEM)
    
    def remove_rule(self, rule_id: str) -> bool:
        """アラートルールを削除"""
        if rule_id in self.rules:
            del self.rules[rule_id]
            logger.info(f"Alert rule removed: {rule_id}", category=LogCategory.SYSTEM)
            return True
        return False
    
    def enable_rule(self, rule_id: str) -> bool:
        """アラートルールを有効化"""
        if rule_id in self.rules:
            self.rules[rule_id].enabled = True
            logger.info(f"Alert rule enabled: {rule_id}", category=LogCategory.SYSTEM)
            return True
        return False
    
    def disable_rule(self, rule_id: str) -> bool:
        """アラートルールを無効化"""
        if rule_id in self.rules:
            self.rules[rule_id].enabled = False
            logger.info(f"Alert rule disabled: {rule_id}", category=LogCategory.SYSTEM)
            return True
        return False
    
    def add_alert_callback(self, callback: Callable[[Alert], None]):
        """アラートコールバックを追加"""
        self.alert_callbacks.append(callback)
    
    async def check_alert_rules(self):
        """アラートルールをチェックして必要に応じてアラートを送信"""
        current_time = datetime.now()
        
        for rule in self.rules.values():
            if not rule.enabled:
                continue
            
            # クールダウン期間チェック
            last_check = self.last_rule_check.get(rule.id)
            if last_check and (current_time - last_check).total_seconds() < rule.cooldown_minutes * 60:
                continue
            
            try:
                await self._check_rule(rule, current_time)
                self.last_rule_check[rule.id] = current_time
            except Exception as e:
                logger.error(
                    f"Failed to check alert rule {rule.id}: {e}",
                    category=LogCategory.SYSTEM,
                    exc_info=True
                )
    
    async def _check_rule(self, rule: AlertRule, current_time: datetime):
        """個別ルールをチェック"""
        # 時間窓の開始時刻
        window_start = current_time - timedelta(minutes=rule.time_window_minutes)
        
        # エラーレポートを取得
        matching_errors = []
        all_reports = error_monitoring_service.get_error_reports()
        
        for report in all_reports:
            # 時間窓内かチェック
            if report.last_occurrence < window_start:
                continue
            
            # 重要度チェック
            severity_values = {
                ErrorSeverity.LOW: 1,
                ErrorSeverity.MEDIUM: 2,
                ErrorSeverity.HIGH: 3,
                ErrorSeverity.CRITICAL: 4
            }
            
            if severity_values.get(report.severity, 0) < severity_values.get(rule.severity_threshold, 0):
                continue
            
            # カテゴリチェック
            if rule.categories and report.category not in rule.categories:
                continue
            
            matching_errors.append(report)
        
        # 閾値チェック
        if len(matching_errors) >= rule.error_count_threshold:
            await self._trigger_alert(rule, matching_errors, current_time)
    
    async def _trigger_alert(self, rule: AlertRule, errors: List[ErrorReport], triggered_at: datetime):
        """アラートをトリガー"""
        import uuid
        
        alert_id = str(uuid.uuid4())
        
        # アラートメッセージ生成
        error_count = len(errors)
        unique_categories = set(error.category for error in errors)
        severities = set(error.severity for error in errors)
        
        message = f"Alert: {rule.name}\\n"
        message += f"Description: {rule.description}\\n"
        message += f"Error Count: {error_count} errors in {rule.time_window_minutes} minutes\\n"
        message += f"Categories: {', '.join(cat.value for cat in unique_categories)}\\n"
        message += f"Severities: {', '.join(sev.value for sev in severities)}\\n"
        message += f"Time Window: {rule.time_window_minutes} minutes\\n"
        message += "\\nError Details:\\n"
        
        for error in errors[:5]:  # 最初の5件のみ表示
            message += f"- {error.message} (Count: {error.occurrence_count})\\n"
        
        if len(errors) > 5:
            message += f"... and {len(errors) - 5} more errors\\n"
        
        # アラート作成
        alert = Alert(
            id=alert_id,
            rule_id=rule.id,
            rule_name=rule.name,
            triggered_at=triggered_at,
            message=message,
            severity=max(error.severity for error in errors),
            error_count=error_count,
            affected_errors=[error.id for error in errors],
            channels_sent=[]
        )
        
        # アラート送信
        sent_channels = []
        for channel in rule.channels:
            try:
                if channel == AlertChannel.EMAIL:
                    await self._send_email_alert(alert)
                    sent_channels.append(channel)
                elif channel == AlertChannel.WEBHOOK:
                    await self._send_webhook_alert(alert)
                    sent_channels.append(channel)
                elif channel == AlertChannel.CONSOLE:
                    self._send_console_alert(alert)
                    sent_channels.append(channel)
            except Exception as e:
                logger.error(
                    f"Failed to send alert via {channel.value}: {e}",
                    category=LogCategory.SYSTEM,
                    exc_info=True
                )
        
        alert.channels_sent = sent_channels
        
        # アラートを記録
        self.active_alerts[alert_id] = alert
        self.alert_history.append(alert)
        
        # コールバック実行
        for callback in self.alert_callbacks:
            try:
                callback(alert)
            except Exception as e:
                logger.error(f"Alert callback failed: {e}", category=LogCategory.SYSTEM)
        
        logger.warning(
            f"Alert triggered: {rule.name}",
            category=LogCategory.SYSTEM,
            alert_id=alert_id,
            error_count=error_count,
            rule_id=rule.id
        )
    
    async def _send_email_alert(self, alert: Alert):
        """メールアラート送信"""
        if not self.config.to_emails:
            logger.warning("No email recipients configured for alerts")
            return
        
        msg = MimeMultipart()
        msg['From'] = self.config.from_email
        msg['To'] = ', '.join(self.config.to_emails)
        msg['Subject'] = f"[{alert.severity.value.upper()}] Todo App Alert: {alert.rule_name}"
        
        body = alert.message
        msg.attach(MimeText(body, 'plain'))
        
        try:
            server = smtplib.SMTP(self.config.smtp_host, self.config.smtp_port)
            if self.config.smtp_use_tls:
                server.starttls()
            if self.config.smtp_username and self.config.smtp_password:
                server.login(self.config.smtp_username, self.config.smtp_password)
            
            server.send_message(msg)
            server.quit()
            
            logger.info(f"Email alert sent for {alert.id}", category=LogCategory.SYSTEM)
            
        except Exception as e:
            logger.error(f"Failed to send email alert: {e}", category=LogCategory.SYSTEM)
            raise
    
    async def _send_webhook_alert(self, alert: Alert):
        """Webhookアラート送信"""
        if not self.config.webhook_url:
            logger.warning("No webhook URL configured for alerts")
            return
        
        import aiohttp
        
        payload = {
            "alert_id": alert.id,
            "rule_name": alert.rule_name,
            "severity": alert.severity.value,
            "message": alert.message,
            "error_count": alert.error_count,
            "triggered_at": alert.triggered_at.isoformat(),
            "affected_errors": alert.affected_errors
        }
        
        headers = {
            "Content-Type": "application/json",
            **self.config.webhook_headers
        }
        
        try:
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    self.config.webhook_url,
                    json=payload,
                    headers=headers,
                    timeout=aiohttp.ClientTimeout(total=30)
                ) as response:
                    if response.status >= 400:
                        raise Exception(f"Webhook returned status {response.status}")
            
            logger.info(f"Webhook alert sent for {alert.id}", category=LogCategory.SYSTEM)
            
        except Exception as e:
            logger.error(f"Failed to send webhook alert: {e}", category=LogCategory.SYSTEM)
            raise
    
    def _send_console_alert(self, alert: Alert):
        """コンソールアラート送信"""
        print(f"\\n{'='*60}")
        print(f"ALERT: {alert.rule_name}")
        print(f"Severity: {alert.severity.value.upper()}")
        print(f"Triggered: {alert.triggered_at}")
        print(f"{'='*60}")
        print(alert.message)
        print(f"{'='*60}\\n")
        
        logger.critical(
            f"Console alert: {alert.rule_name}",
            category=LogCategory.SYSTEM,
            alert_details=alert.message
        )
    
    def acknowledge_alert(self, alert_id: str, acknowledged_by: str) -> bool:
        """アラートを確認済みにする"""
        if alert_id in self.active_alerts:
            alert = self.active_alerts[alert_id]
            alert.acknowledged = True
            alert.acknowledged_by = acknowledged_by
            alert.acknowledged_at = datetime.now()
            
            # アクティブアラートから削除
            del self.active_alerts[alert_id]
            
            logger.info(
                f"Alert acknowledged: {alert_id}",
                category=LogCategory.AUDIT,
                acknowledged_by=acknowledged_by
            )
            return True
        return False
    
    def get_active_alerts(self) -> List[Alert]:
        """アクティブなアラート一覧を取得"""
        return list(self.active_alerts.values())
    
    def get_alert_history(self, limit: int = 100) -> List[Alert]:
        """アラート履歴を取得"""
        return self.alert_history[-limit:]
    
    def get_rules(self) -> Dict[str, AlertRule]:
        """アラートルール一覧を取得"""
        return self.rules.copy()
    
    def get_alert_statistics(self) -> Dict[str, Any]:
        """アラート統計を取得"""
        total_alerts = len(self.alert_history)
        active_alerts = len(self.active_alerts)
        
        # 過去24時間のアラート
        now = datetime.now()
        past_24h = now - timedelta(hours=24)
        recent_alerts = [
            alert for alert in self.alert_history
            if alert.triggered_at >= past_24h
        ]
        
        # 重要度別統計
        severity_stats = {}
        for severity in ErrorSeverity:
            severity_stats[severity.value] = len([
                alert for alert in recent_alerts
                if alert.severity == severity
            ])
        
        return {
            "total_alerts": total_alerts,
            "active_alerts": active_alerts,
            "alerts_last_24h": len(recent_alerts),
            "severity_distribution": severity_stats,
            "rules_count": len(self.rules),
            "enabled_rules": len([r for r in self.rules.values() if r.enabled])
        }

# グローバルインスタンス
alert_service = AlertService()

# バックグラウンドタスクでアラートルールを定期チェック
async def alert_monitoring_task():
    """アラート監視バックグラウンドタスク"""
    while True:
        try:
            await alert_service.check_alert_rules()
            await asyncio.sleep(60)  # 1分ごとにチェック
        except Exception as e:
            logger.error(f"Alert monitoring task error: {e}", category=LogCategory.SYSTEM, exc_info=True)
            await asyncio.sleep(60)

# アプリケーション起動時にバックグラウンドタスクを開始
def start_alert_monitoring():
    """アラート監視を開始"""
    asyncio.create_task(alert_monitoring_task())