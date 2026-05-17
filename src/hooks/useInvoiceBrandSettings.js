import { useProfileSettings } from "../contexts/ProfileSettingsContext";
import { useGeneralSettings } from "../contexts/GeneralSettingsContext";


export function useInvoiceBrandSettings(){

    const { generalSettings } = useGeneralSettings()
    const { profileSettings } = useProfileSettings()

    const INVOICE_BRAND_SETTINGS = {

        name: profileSettings.brandName || "",
        tagline: profileSettings.brandTagline || "",
        colourId: profileSettings.brandColourId || 'classic-warm-black',
        colour: profileSettings.brandColour || '#1C1814',
        logo: profileSettings.brandLogo || null, 

        phone: profileSettings.brandPhone || '',
        email: profileSettings.brandEmail || '',
        address: profileSettings.brandAddress || '',
        website: profileSettings.brandWebsite || '',

        signature: profileSettings.brandSignature || null, 

        accountBank: profileSettings.accountBank || '',
        accountNumber: profileSettings.accountNumbe || '',
        accountName: profileSettings.accountName || '',

        prefix: generalSettings.invoicePrefix || 'INV',
        currency: generalSettings.invoiceCurrency || '₦',
        template: generalSettings.invoiceTemplate || 'invoiceTemplate1',
        showTax: generalSettings.invoiceShowTax || false,
        taxRate: generalSettings.invoiceTaxRate || 0,
        footer: generalSettings.invoiceFooter || 'Thank you for your patronage 🙏',

    }

    return INVOICE_BRAND_SETTINGS


}