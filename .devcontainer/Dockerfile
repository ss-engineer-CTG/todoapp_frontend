# Todo App Development Environment
# Base: Ubuntu 22.04 with Node.js 18 and Python 3.11.4

FROM mcr.microsoft.com/devcontainers/base:ubuntu-22.04

# Set environment variables
ENV DEBIAN_FRONTEND=noninteractive
ENV PYTHONUNBUFFERED=1
ENV NODE_ENV=development
ENV PYTHON_VERSION=3.11.4

# Install system dependencies
RUN apt-get update && apt-get install -y \
    curl \
    wget \
    git \
    build-essential \
    software-properties-common \
    ca-certificates \
    gnupg \
    lsb-release \
    sqlite3 \
    pkg-config \
    libssl-dev \
    libffi-dev \
    libsqlite3-dev \
    zlib1g-dev \
    libbz2-dev \
    libreadline-dev \
    libncurses5-dev \
    libncursesw5-dev \
    xz-utils \
    tk-dev \
    && rm -rf /var/lib/apt/lists/*

# Install Node.js 18.x
RUN curl -fsSL https://deb.nodesource.com/setup_18.x | bash - \
    && apt-get install -y nodejs

# Install pyenv for Python version management
RUN git clone https://github.com/pyenv/pyenv.git /opt/pyenv
ENV PYENV_ROOT=/opt/pyenv
ENV PATH=$PYENV_ROOT/bin:$PATH

# Configure pyenv and install Python 3.11.4
RUN echo 'export PYENV_ROOT=/opt/pyenv' >> /etc/bash.bashrc \
    && echo 'export PATH=$PYENV_ROOT/bin:$PATH' >> /etc/bash.bashrc \
    && echo 'eval "$(pyenv init -)"' >> /etc/bash.bashrc

# Install Python 3.11.4
RUN pyenv install 3.11.4 \
    && pyenv global 3.11.4 \
    && pyenv rehash

# Create symlinks for global Python access
RUN ln -sf /opt/pyenv/versions/3.11.4/bin/python /usr/local/bin/python \
    && ln -sf /opt/pyenv/versions/3.11.4/bin/python3 /usr/local/bin/python3 \
    && ln -sf /opt/pyenv/versions/3.11.4/bin/pip /usr/local/bin/pip \
    && ln -sf /opt/pyenv/versions/3.11.4/bin/pip3 /usr/local/bin/pip3

# Upgrade pip and install common Python tools
RUN python -m pip install --upgrade pip setuptools wheel \
    && pip install virtualenv pipenv poetry

# Install global npm packages
RUN npm install -g \
    npm@latest \
    typescript \
    ts-node \
    @typescript-eslint/parser \
    @typescript-eslint/eslint-plugin \
    eslint \
    prettier \
    vite \
    concurrently \
    wait-on \
    cross-env

# Create workspace directory
WORKDIR /workspace

# Setup user permissions
RUN chown -R vscode:vscode /workspace \
    && chown -R vscode:vscode /opt/pyenv

# Switch to vscode user
USER vscode

# Configure shell for vscode user
RUN echo 'export PYENV_ROOT=/opt/pyenv' >> ~/.bashrc \
    && echo 'export PATH=$PYENV_ROOT/bin:$PATH' >> ~/.bashrc \
    && echo 'eval "$(pyenv init -)"' >> ~/.bashrc \
    && echo 'alias python=python3' >> ~/.bashrc \
    && echo 'alias pip=pip3' >> ~/.bashrc

# Configure zsh if available
RUN if [ -f ~/.zshrc ]; then \
        echo 'export PYENV_ROOT=/opt/pyenv' >> ~/.zshrc \
        && echo 'export PATH=$PYENV_ROOT/bin:$PATH' >> ~/.zshrc \
        && echo 'eval "$(pyenv init -)"' >> ~/.zshrc \
        && echo 'alias python=python3' >> ~/.zshrc \
        && echo 'alias pip=pip3' >> ~/.zshrc; \
    fi

# Verify installations
RUN node --version \
    && npm --version \
    && python --version \
    && pip --version

# Expose ports for development
EXPOSE 3000 8000

# Default command
CMD ["/bin/bash"]