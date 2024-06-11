const fs = require('fs')
const path = require('path')

module.exports = async (req, res) => {
  const indexFile = path.resolve(__dirname, '../public/index.html')
  const cssFile = path.resolve(__dirname, '../public/style.css')

  try {
    
    const [indexRAW, cssRAW] = await Promise.all([
      fs.promises.readFile(indexFile, 'utf8'),
      fs.promises.readFile(cssFile, 'utf8')
    ])

    console.log('Successfully read index.html and style.css')

   
    let dataDiEdit = indexRAW.replace(/<head>/, `<head><style>${cssRAW}</style>`)

    // ---- Metode Injeksi Mengirim Request Dengan File Yang Telah Di Injeksi -----------
    res.setHeader('Content-Type', 'text/html')
    res.send(dataDiEdit)
  } catch (err) {
    console.error('Error processing files:', err)
    res.status(500).send('Error processing files')
  }
}
