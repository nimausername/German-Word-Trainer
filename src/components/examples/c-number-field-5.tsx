import {
  NumberField,
  NumberFieldDecrement,
  NumberFieldGroup,
  NumberFieldIncrement,
  NumberFieldInput,
  NumberFieldScrubArea,
} from "@/components/reui/number-field"
import { ChevronUpIcon, ChevronDownIcon } from "lucide-react"

export function Pattern() {
  return (
    <div className="w-full max-w-48">
      <NumberField defaultValue={5} min={0} max={100}>
        <NumberFieldScrubArea label="Amount" />
        <NumberFieldGroup>
          <NumberFieldInput className="text-start" />

          <div className="border-input bg-muted/30 rounded-lg m-px flex shrink-0 flex-col overflow-hidden border">
            <NumberFieldIncrement className="border-input hover:bg-accent focus-visible:bg-accent flex h-3.5 w-full flex-1 shrink-0 items-center rounded-none! border-b px-1.5 leading-none">
              <ChevronUpIcon className="size-3.5" />
            </NumberFieldIncrement>
            <NumberFieldDecrement className="hover:bg-accent focus-visible:bg-accent flex h-3.5 w-full flex-1 shrink-0 items-center rounded-none! px-1.5 leading-none">
              <ChevronDownIcon className="size-3.5" />
            </NumberFieldDecrement>
          </div>
        </NumberFieldGroup>
      </NumberField>
    </div>
  )
}