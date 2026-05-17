


import styles from "./InvoiceSettingsModal.module.css"
import { FullModal } from "../../components/FullModal/FullModal"
import { SegmentControl } from "../../components/SegmentControl/SegmentControl"
import { useState } from "react"
import { useGeneralSettings } from "../../../../contexts/GeneralSettingsContext"
import { Field,FieldGroup } from "../../components/FormField/FormField"
import { Textarea,TextInput } from "../../components/FormInput/FormInput"
import { Toggle } from "../../components/Toggle/Toggle"


export function InvoiceSettingsModal({ onBack, showToast }) {
  const { generalSettings, updateManyGeneralSettings } = useGeneralSettings()
  const [local, setLocal] = useState({
    invoicePrefix:   generalSettings.invoicePrefix,
    invoiceCurrency: generalSettings.invoiceCurrency,
    invoiceDueDays:  generalSettings.invoiceDueDays,
    invoiceShowTax:  generalSettings.invoiceShowTax,
    invoiceTaxRate:  generalSettings.invoiceTaxRate,
    invoiceFooter:   generalSettings.invoiceFooter,
  })
  const set = key => val => setLocal(p=>({...p,[key]:val}))
  const save = () => { updateManyGeneralSettings(local); showToast('Invoice settings saved'); onBack() }
  return (
    <FullModal title="Invoice Settings" onBack={onBack} onSave={save}>
      <div>
        <FieldGroup>
          <Field label="Invoice Number Prefix" hint="Shown before the number, e.g. INV-0042.">
            <TextInput value={local.invoicePrefix} onChange={set('invoicePrefix')} placeholder="INV" />
          </Field>
          <Field label="Currency">
            <SegmentControl options={[{label:'₦ Naira',value:'₦'},{label:'$ Dollar',value:'$'},{label:'£ Pound',value:'£'},{label:'€ Euro',value:'€'}]} value={local.invoiceCurrency} onChange={set('invoiceCurrency')} />
          </Field>
          <Field label="Default Due Period" hint="Days after issue date the invoice is due.">
            <SegmentControl options={[{label:'3 days',value:3},{label:'7 days',value:7},{label:'14 days',value:14},{label:'30 days',value:30}]} value={local.invoiceDueDays} onChange={set('invoiceDueDays')} />
          </Field>
        </FieldGroup>
        <div style={{ height:12 }} />
        <FieldGroup>
          <div className={styles.row} style={{ borderBottom: local.invoiceShowTax?'1px solid var(--border)':'none' }}>
            <div className={styles.rowIcon}><span className="mi" style={{ fontSize:'1.15rem' }}>percent</span></div>
            <div className={styles.rowText}>
              <div className={styles.rowLabel}>Show Tax Line</div>
              <div className={styles.rowSub}>Add a VAT / tax row to invoice totals</div>
            </div>
            <div className={styles.rowRight}><Toggle value={local.invoiceShowTax} onChange={v=>set('invoiceShowTax')(v)} /></div>
          </div>
          {local.invoiceShowTax && (
            <Field label="Tax Rate (%)" hint="e.g. 7.5 for 7.5% VAT">
              <TextInput type="number" value={String(local.invoiceTaxRate)} onChange={v=>set('invoiceTaxRate')(parseFloat(v)||0)} placeholder="7.5" />
            </Field>
          )}
        </FieldGroup>
        <div style={{ height:12 }} />
        <FieldGroup>
          <Field label="Invoice Footer Text" hint="Printed at the bottom of every invoice.">
            <Textarea value={local.invoiceFooter} onChange={set('invoiceFooter')} placeholder="Thank you for your patronage 🙏" rows={3} />
          </Field>
        </FieldGroup>
      </div>
    </FullModal>
  )
}