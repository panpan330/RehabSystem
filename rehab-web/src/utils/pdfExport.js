import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'

export const exportToPDF = async (elementId, fileName) => {
  const element = document.getElementById(elementId)
  if (!element) {
    alert('未找到要导出的内容')
    return
  }

  try {
    // 1. 把指定的 DOM 节点变成 canvas 图片
    const canvas = await html2canvas(element, {
      scale: 2, // 提高清晰度
      useCORS: true, // 允许跨域图片
      logging: false,
      backgroundColor: '#ffffff' // 确保背景是白的
    })

    // 2. 计算 PDF 尺寸 (A4纸)
    const contentWidth = canvas.width
    const contentHeight = canvas.height
    
    // A4 纸的尺寸 (mm)
    const pdfPageWidth = 210
    const pdfPageHeight = 297
    
    // 页面内容在 PDF 中的高度
    const imgWidth = pdfPageWidth
    const imgHeight = (pdfPageWidth / contentWidth) * contentHeight

    // 3. 生成 PDF
    const pdf = new jsPDF('p', 'mm', 'a4')
    
    // 把图片贴进 PDF
    pdf.addImage(
      canvas.toDataURL('image/jpeg', 1.0), 
      'JPEG', 
      0, 
      0, 
      imgWidth, 
      imgHeight
    )

    // 4. 下载
    pdf.save(fileName + '.pdf')

  } catch (error) {
    console.error('导出失败:', error)
    alert('导出 PDF 失败，请检查控制台')
  }
}