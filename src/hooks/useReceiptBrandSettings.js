import { useProfileSettings } from "../contexts/ProfileSettingsContext";
import { useGeneralSettings } from "../contexts/GeneralSettingsContext";


export function useReceiptBrandSettings(){

    const { generalSettings } = useGeneralSettings()
    const { profileSettings } = useProfileSettings()

    const RECEIPT_BRAND_SETTINGS = {

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

        prefix: generalSettings.receiptPrefix || 'RCP',
        currency: generalSettings.receiptCurrency || '₦',
        template: generalSettings.receiptTemplate || 'receiptTemplate1',
        showTax: generalSettings.receiptShowTax || false,
        taxRate: generalSettings.receiptTaxRate || 0,
        footer: generalSettings.receiptFooter || 'Thank you for your patronage 🙏',

    }

    return RECEIPT_BRAND_SETTINGS


}