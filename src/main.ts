import './style.css'
import Editor from './editor'

window.onload = function () {

  const canvas = document.querySelector<HTMLCanvasElement>('canvas')
  if (!canvas) return
  const text = `\n主诉：\n发热三天，咳嗽五天。\n现病史：\n发病前14天内有病历报告社区的旅行时或居住史；发病前14天内与新型冠状病毒感染的患者或无症状感染者有接触史；发病前14天内解除过来自病历报告社区的发热或有呼吸道症状的患者；聚集性发病，2周内在小范围如家庭、办公室、学校班级等场所，出现2例及以上发热或呼吸道症状的病例。\n既往史：\n有糖尿病10年，有高血压2年，有传染性疾病1年。\n体格检查：\nT：36.5℃，P：80bpm，R：20次/分，BP：120/80mmHg；\n辅助检查：\n2020年6月10日，普放：血细胞比容36.50%（偏低）40～50；单核细胞绝对值0.75*10^9/L（偏高）参考值：0.1～0.6；\n门诊诊断：\n1.高血压\n处置治疗：\n1.超声引导下甲状腺细针穿刺术；\n2.乙型肝炎表面抗体测定；\n3.膜式病变细胞采集术、后颈皮下肤层；\n4.氯化钠注射液 250ml/袋、1袋；\n5.七叶皂苷钠片（欧开）、30mg/片*24/盒、1片、口服、BID（每日两次）、1天`
  // 模拟加粗字
  const boldText = ['主诉：', '现病史：', '既往史：', '体格检查：', '辅助检查：', '门诊诊断：', '处置治疗：']
  const boldIndex: number[] = boldText.map(b => {
    const i = text.indexOf(b)
    return ~i ? Array(b.length).fill(i).map((_, j) => i + j) : []
  }).flat()
  // 模拟颜色字
  const colorText = ['传染性疾病']
  const colorIndex: number[] = colorText.map(b => {
    const i = text.indexOf(b)
    return ~i ? Array(b.length).fill(i).map((_, j) => i + j) : []
  }).flat()
  // 组合数据
  const data = text.split('').map((value, index) => {
    if (boldIndex.includes(index)) {
      return {
        value,
        size: 18,
        bold: true
      }
    }
    if (colorIndex.includes(index)) {
      return {
        value,
        color: 'red',
        size: 16
      }
    }
    return {
      value,
      size: 16
    }
  })
  // 初始化编辑器
  const instance = new Editor(canvas, data, {
    margins: [120, 120, 200, 120]
  })
  console.log('编辑器实例: ', instance)

  // 撤销、重做、格式刷、清除格式
  document.querySelector<HTMLDivElement>('.menu-item__undo')!.onclick = function () {
    console.log('undo')
    instance.command.executeUndo()
  }
  document.querySelector<HTMLDivElement>('.menu-item__redo')!.onclick = function () {
    console.log('redo')
    instance.command.executeRedo()
  }
  document.querySelector<HTMLDivElement>('.menu-item__painter')!.onclick = function () {
    console.log('painter')
    instance.command.executePainter()
  }
  document.querySelector<HTMLDivElement>('.menu-item__format')!.onclick = function () {
    console.log('format')
    instance.command.executeFormat()
  }

  // 字体变大、字体变小、加粗、斜体、下划线、删除线、字体颜色、背景色
  document.querySelector<HTMLDivElement>('.menu-item__bold')!.onclick = function () {
    console.log('bold')
    instance.command.executeBold()
  }

  // 搜索、打印
  document.querySelector<HTMLDivElement>('.menu-item__print')!.onclick = function () {
    console.log('print')
    instance.command.executePrint()
  }

}