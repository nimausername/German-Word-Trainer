import { Button } from "@/components/ui/button"
import { ButtonGroup } from "@/components/ui/button-group"
import { LayoutGridIcon, ListIcon, TableIcon } from "lucide-react"

export function Pattern() {
  return (
    <ButtonGroup>
      <Button variant="outline" size="icon" aria-label="Grid view">
        <LayoutGridIcon aria-hidden="true" />
      </Button>
      <Button variant="outline" size="icon" aria-label="List view">
        <ListIcon aria-hidden="true" />
      </Button>
      <Button variant="outline" size="icon" aria-label="Table view">
        <TableIcon aria-hidden="true" />
      </Button>
    </ButtonGroup>
  )
}