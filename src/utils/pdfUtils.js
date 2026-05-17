async function renderElementToBlob(element, cssVars, exactHeight) {
  const PDF_WIDTH      = 380
  const INITIAL_HEIGHT = Math.max(800, element.scrollHeight + 100)

  const styleTexts = await Promise.all(
    Array.from(document.styleSheets).map(async sheet => {
      try {
        if (sheet.cssRules) {
          return Array.from(sheet.cssRules).map(r => r.cssText).join('\n')
        }
      } 
      catch (_) { 

       }
      if (sheet.href) {
        try {
          const res = await fetch(sheet.href)
          return await res.text()
        } catch (_) { return '' }
      }
      return ''
    })
  )

  const iframe = document.createElement('iframe')
  Object.assign(iframe.style, {
    position:   'fixed',
    top:        '-99999px',
    left:       '-99999px',
    width:      `${PDF_WIDTH}px`,
    height:     `${INITIAL_HEIGHT}px`,
    border:     'none',
    visibility: 'hidden',
  })
  document.body.appendChild(iframe)

  const iDoc = iframe.contentDocument
  const iWin = iframe.contentWindow


  iDoc.open()
  iDoc.write(`
    <!DOCTYPE html>
    <html style="width:${PDF_WIDTH}px; min-height:${INITIAL_HEIGHT}px;">
      <head>
        <meta charset="utf-8"/>
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Manrope:wght@200..800&display=swap" rel="stylesheet">
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; }
          html, body {
            width: ${PDF_WIDTH}px;
            min-height: ${INITIAL_HEIGHT}px;
            background: #fff;
            overflow: visible;
            font-family: "Manrope", sans-serif;
          }
          ${styleTexts.join('\n')}
        </style>
      </head>
      <body>${element.outerHTML}</body>
    </html>
  `)
  iDoc.close()

  const iframeEl = iDoc.body.firstElementChild
  if (cssVars && iframeEl) {
    Object.entries(cssVars).forEach(([k, v]) => iframeEl.style.setProperty(k, v))
  }

  await iDoc.fonts.ready
  await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)))
  await new Promise(r => setTimeout(r, 1500))

  let trueHeight = iDoc.body.scrollHeight

  iDoc.body.querySelectorAll('*').forEach(el => {
    const rect   = el.getBoundingClientRect()
    const bottom = rect.bottom + iWin.scrollY
    if (bottom > trueHeight) trueHeight = bottom
  })

  const height = exactHeight || (Math.ceil(trueHeight) + 8)

  iframe.style.height                  = `${height}px`
  iDoc.documentElement.style.minHeight = `${height}px`
  iDoc.body.style.minHeight            = `${height}px`

  await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)))

  const canvas = await html2canvas(iDoc.body, {
    scale:           3,
    useCORS:         true,
    allowTaint:      true,
    backgroundColor: '#ffffff',
    logging:         false,
    width:           PDF_WIDTH,
    height,
    windowWidth:     PDF_WIDTH,
    windowHeight:    height,
    scrollX:         0,
    scrollY:         0,
  })


  document.body.removeChild(iframe)

  const imgData = canvas.toDataURL('image/jpeg', 0.94)
  const pdf     = new jsPDF({ orientation: 'portrait', unit: 'px', format: [PDF_WIDTH, height] })
  pdf.addImage(imgData, 'JPEG', 0, 0, PDF_WIDTH, height)

  return pdf.output('blob')
}

export async function generatePDFBlob(element, cssVars, exactHeight) {
  return renderElementToBlob(element, cssVars, exactHeight)
}

export async function downloadPDF(element, filename, cssVars, exactHeight) {
  const blob = await renderElementToBlob(element, cssVars, exactHeight)
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = filename
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 10_000)
}

export async function sharePDF(element, filename, message, cssVars, exactHeight) {
  const blob = await renderElementToBlob(element, cssVars, exactHeight)
  const file = new File([blob], filename, { type: 'application/pdf' })

  const canShareFile = typeof navigator.share === 'function'
    && typeof navigator.canShare === 'function'
    && navigator.canShare({ files: [file] })

  if (canShareFile) {
    await navigator.share({ files: [file], text: message })
  } 
  else if (typeof navigator.share === 'function') {
    await navigator.share({ title: filename, text: message })
  } 
  else {
    const url = URL.createObjectURL(blob)
    const a   = document.createElement('a')
    a.href = url; 
    a.download = filename; 
    a.click()
    setTimeout(() => URL.revokeObjectURL(url), 10_000)
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank', 'noopener')
  }
}
