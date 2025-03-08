import { Bird } from "lucide-react"

export default function GameLogo({ className = "" }: { className?: string }) {
  return (
    <div className={`flex flex-col items-center ${className}`}>
      <div className="flex items-center gap-2">
        <Bird className="h-12 w-12 text-orange-500" />
        <h1 className="text-4xl font-extrabold text-orange-600">
          Chidiya <span className="text-yellow-500">Udh</span>
        </h1>
      </div>
      <p className="text-orange-700 font-medium mt-1">The Flying Game</p>
    </div>
  )
}

