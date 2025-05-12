import React from "react"

interface ShortcutKeyProps {
  keys: string
}

export default function ShortcutKey({ keys }: ShortcutKeyProps) {
  const keyArray = keys.split('+')
  return (
    <div className="flex items-center gap-1">
      {keyArray.map((key, index) => (
        <React.Fragment key={key}>
          <kbd className="px-2 py-1 text-xs font-semibold bg-gray-100 border border-gray-300 rounded-md shadow-sm">{key}</kbd>
          {index < keyArray.length - 1 && <span className="text-gray-500">+</span>}
        </React.Fragment>
      ))}
    </div>
  )
}