import { Check, Trash2 } from 'lucide-react'
import { Badge, Button, EmptyState, Field, Notice, Panel, Table, getFieldAria } from '../components/ui'

/**
 * Stable, data-free examples for accessibility review and future screenshot tests.
 * This component is intentionally not linked from production navigation.
 */
export function DesignSystemExamples() {
  const dateAria = getFieldAria('design-example-date', { hasDescription: true })
  return (
    <div className="design-system-examples container-workspace" data-visual-regression="design-system-foundations">
      <Panel
        title="Shared controls"
        description="Foundation examples use no student or production data."
        actions={<Button variant="secondary">Secondary action</Button>}
      >
        <div className="design-system-examples__grid">
          <div className="design-system-examples__group">
            <h3>Actions</h3>
            <div className="design-system-examples__row">
              <Button icon={<Check size={17} />}>Save changes</Button>
              <Button variant="danger-soft" icon={<Trash2 size={17} />}>Delete</Button>
            </div>
          </div>
          <div className="design-system-examples__group">
            <h3>States</h3>
            <div className="design-system-examples__row">
              <Badge tone="success">Complete</Badge>
              <Badge tone="warning">Awaiting signature</Badge>
              <Badge tone="danger">Cancelled</Badge>
            </div>
          </div>
          <Field id="design-example-date" label="Assessment date" description="Use the date the assessment was completed." required>
            <input {...dateAria} type="date" />
          </Field>
          <Notice tone="success" title="Saved">The governed record was updated successfully.</Notice>
        </div>
      </Panel>

      <Panel title="Responsive records" description="The region scrolls without expanding the viewport shell.">
        <Table caption="Example assessment records" stickyHeader>
          <thead><tr><th scope="col">Assessment</th><th scope="col">Period</th><th scope="col">Status</th></tr></thead>
          <tbody><tr><td>TOSREC</td><td>Fall</td><td><Badge tone="success">Complete</Badge></td></tr></tbody>
        </Table>
      </Panel>

      <Panel title="Empty state">
        <EmptyState title="No records found">Change the selected context or add the first governed record.</EmptyState>
      </Panel>
    </div>
  )
}
