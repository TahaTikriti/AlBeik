import type { DefaultServerCellComponentProps } from 'payload'

const USD = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })

/** List cells in plain words: "$11.65" or a dash, not "<No Combo price>". */
export function PriceCell({ cellData }: DefaultServerCellComponentProps) {
  return <span>{typeof cellData === 'number' ? USD.format(cellData) : '–'}</span>
}

/** "On the menu" reads Yes / Hidden instead of true / false. */
export function AvailableCell({ cellData }: DefaultServerCellComponentProps) {
  return cellData === false ? (
    <span style={{ color: '#d8262f', fontWeight: 600 }}>Hidden</span>
  ) : (
    <span>Yes</span>
  )
}
