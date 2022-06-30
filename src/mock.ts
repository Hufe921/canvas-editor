import { ControlType, ElementType, IEditorOption, IElement, RowFlex } from './editor'

const text = `人民医院门诊病历\n主诉：\n发热三天，咳嗽五天。\n现病史：\n患者于三天前无明显诱因，感冒后发现面部水肿，无皮疹，尿量减少，出现乏力，在外治疗无好转，现来我院就诊。\n既往史：\n有糖尿病10年，有高血压2年，有传染性疾病1年。报告其他既往疾病。\n流行病史：\n否认14天内接触过确诊患者、疑似患者、无症状感染者及其密切接触者；否认14天内去过以下场所：水产、肉类批发市场，农贸市场，集市，大型超市，夜市；否认14天内与以下场所工作人员密切接触：水产、肉类批发市场，农贸市场，集市，大型超市；否认14天内周围（如家庭、办公室）有2例以上聚集性发病；否认14天内接触过有发热或呼吸道症状的人员；否认14天内自身有发热或呼吸道症状；否认14天内接触过纳入隔离观察的人员及其他可能与新冠肺炎关联的情形；陪同家属无以上情况。\n体格检查：\nT：39.5℃，P：80bpm，R：20次/分，BP：120/80mmHg；\n辅助检查：\n2020年6月10日，普放：血细胞比容36.50%（偏低）40～50；单核细胞绝对值0.75*10/L（偏高）参考值：0.1～0.6；\n门诊诊断：\n1.高血压\n2.糖尿病\n3.病毒性感冒\n4.过敏性鼻炎\n5.过敏性鼻息肉\n处置治疗：\n1.超声引导下甲状腺细针穿刺术；\n2.乙型肝炎表面抗体测定；\n3.膜式病变细胞采集术、后颈皮下肤层；\n电子签名：【】\n其他记录：`

// 模拟行居中
const centerText = ['人民医院门诊病历']
const centerIndex: number[] = centerText.map(c => {
  const i = text.indexOf(c)
  return ~i ? Array(c.length).fill(i).map((_, j) => i + j) : []
}).flat()

// 模拟加粗字
const boldText = ['主诉：', '现病史：', '既往史：', '流行病史：', '体格检查：', '辅助检查：', '门诊诊断：', '处置治疗：', '电子签名：', '其他记录：']
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

// 模拟高亮字
const highlightText = ['血细胞比容']
const highlightIndex: number[] = highlightText.map(b => {
  const i = text.indexOf(b)
  return ~i ? Array(b.length).fill(i).map((_, j) => i + j) : []
}).flat()

// 组合纯文本数据
const elementList: IElement[] = text.split('').map((value, index) => {
  if (centerIndex.includes(index)) {
    return {
      value,
      size: 32,
      rowFlex: RowFlex.CENTER
    }
  }
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
      color: '#FF0000',
      size: 16
    }
  }
  if (highlightIndex.includes(index)) {
    return {
      value,
      highlight: '#F2F27F'
    }
  }
  return {
    value,
    size: 16
  }
})

// 模拟分隔符
elementList.splice(8, 0, {
  value: '\n',
  type: ElementType.SEPARATOR
})

// 模拟文本控件
elementList.splice(24, 0, {
  type: ElementType.CONTROL,
  value: '',
  control: {
    type: ControlType.TEXT,
    value: null,
    placeholder: '其他补充',
    prefix: '{',
    postfix: '}'
  }
})

// 模拟下拉控件
elementList.splice(112, 0, {
  type: ElementType.CONTROL,
  value: '',
  control: {
    type: ControlType.SELECT,
    value: null,
    code: null,
    placeholder: '有无',
    prefix: '{',
    postfix: '}',
    valueSets: [{
      value: '有',
      code: '98175'
    }, {
      value: '无',
      code: '98176'
    }, {
      value: '不详',
      code: '98177'
    }]
  }
})

// 模拟超链接
elementList.splice(138, 0, {
  type: ElementType.HYPERLINK,
  value: '',
  valueList: [{
    value: '新',
    size: 16
  }, {
    value: '冠',
    size: 16
  }, {
    value: '肺',
    size: 16
  }, {
    value: '炎',
    size: 16
  }],
  url: 'https://hufe.club/canvas-editor'
})

// 模拟下标
elementList.splice(371, 0, {
  value: '∆',
  color: '#FF0000',
  type: ElementType.SUBSCRIPT
})

// 模拟上标
elementList.splice(459, 0, {
  value: '9',
  type: ElementType.SUPERSCRIPT
})

// 模拟图片
elementList.splice(585, 0, {
  value: `data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAFkAAAAgCAYAAAB5JtSmAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAQ0SURBVGhD7dhrUSNBFAVgvKACEVjAAhJQgAIUYAABGEAABvgfAdn6UnWou01PppOZhIXNj1P9vo9zH5PK1Waz2V5wWlxIPgMuJJ8Bi0h+fn7eXl9fb29ubrYPDw/dO/8DHh8fu/vB4kym4Orqaofb29vund8OSSbhemewSrugBMnG3vlvw9vb265yn56edmtz/t/f33+5C8MkixQSZSsl9UzLOHUmcwTYAN/Rpl5eXnY+pnIB0Xd3d7s5m3rvDsrkCGszNiQ7r/tr4v39fSc/uipOqRcqufTHBiO78GGdzG5xcLtIFmVde7L9NsvXRo9s84+Pj+79pUAwn5GcD1wIz5r+fYGeJdnjGiF9hwL7iWAcfX19/evtKVHJXrtN8Rf4A3TVczqhrut5i1mSZQgnIriSWtdzP2N+EvIhi3/GWqHWtWXuy2IYbheiKarJZIZknkxyrryc2Utrgal+9S8iScUXIx/3kcxfe/jotcuDezLFlIbARDrzHpytXdKnQr4xyc74Vu9YV5Ih2Q/tT7mDSEYw5ZU4wu3nJx64k/1z9umlUG0hah/JSbC6Jzi5exDJWoTHERoBxu8uf/pT1j3HDkUIJitjbRfRA/iwVzlgy1RCfSF5ili9xj7BUWKs9wJZ3MpditYu+lsc+/PRx53cVF9Pdg/syE9Hb6cS75PkmhUEUFofmTvLGEXKimHueJP9Y3swWQwGLUiA9xEbHKuvgs4pPe1+1myTAKlw81buJ8kigjAXKauXPLQPhEYgJSEYsgdTUR0BmTVgc6C359wcvKGnBrGO8dO5VlD1ZZ519nrBHvrwKVMCas9hgL0YUI2wV98fC4FqCWizzXyqF44A0ZKLHkilgvPs1zbiTuZIdZ414KvqGCKZYx4zple+MSrrJVncAyL02/TOqncJwVMglx5zI4QDZ5WPvBGEcNP+7TlEcqJIAQFGsIdQjmZt7MlYA5yiI3pOQTCQXUm2TuVmXgmewxDJQDgl6deJJoU5y7p9uwZagmu1mCvbNoOOBfkhOf6lRZjzPb8qRjBMMiUhM9GNMZQq5/oRXBP7Mlj/i12A7EMIaJGqDcl8I79+/N1xTvdINQ2TDAQSvI9Md479vdqCHKSFQKAfEmgBqCTDkjaSgOZXQkg2jy1ti0xApnBQJo/0obQRipeQXbN3CmxKGQch5xgki4Efghl/kFqzPD//2DnXIodIRpaoETaXxcmwGNO7N4I2Oyuc6b+xK/tL9IH3kY/E+r1JdST4yM+7VUiuJbuPZHBeHZcNvXtziMMV9mRuvUOX8Vg9IFjRx9dUYM3s2oJyNx9ahFfSWwyRHKHG3nmL2q/mojyFVAWnEdi2Hg7OBXwUCCKr1QEtoe0+/9jI3xqIiuF2QRD0zqcwpfQnge9TVSI4tWrNe79shj98F0xDC0N4bTUVF5LPgAvJJ8dm+wcP2iJuZNdC5QAAAABJRU5ErkJggg==`,
  width: 89,
  height: 32,
  id: 'signature',
  type: ElementType.IMAGE
})

// 模拟表格
elementList.push({
  type: ElementType.TABLE,
  value: `\n`,
  colgroup: [{
    width: 180
  }, {
    width: 80
  }, {
    width: 130
  }, {
    width: 130
  }],
  trList: [{
    height: 40,
    tdList: [{
      colspan: 1,
      rowspan: 2,
      value: [
        { value: `1`, size: 16 },
        { value: '.', size: 16 }
      ]
    }, {
      colspan: 1,
      rowspan: 1,
      value: [
        { value: `2`, size: 16 },
        { value: '.', size: 16 }
      ]
    }, {
      colspan: 2,
      rowspan: 1,
      value: [
        { value: `3`, size: 16 },
        { value: '.', size: 16 }
      ]
    }]
  }, {
    height: 40,
    tdList: [{
      colspan: 1,
      rowspan: 1,
      value: [
        { value: `4`, size: 16 },
        { value: '.', size: 16 }
      ]
    }, {
      colspan: 1,
      rowspan: 1,
      value: [
        { value: `5`, size: 16 },
        { value: '.', size: 16 }
      ]
    }, {
      colspan: 1,
      rowspan: 1,
      value: [
        { value: `6`, size: 16 },
        { value: '.', size: 16 }
      ]
    }]
  }, {
    height: 40,
    tdList: [{
      colspan: 1,
      rowspan: 1,
      value: [
        { value: `7`, size: 16 },
        { value: '.', size: 16 }
      ]
    }, {
      colspan: 1,
      rowspan: 1,
      value: [
        { value: `8`, size: 16 },
        { value: '.', size: 16 }
      ]
    }, {
      colspan: 1,
      rowspan: 1,
      value: [
        { value: `9`, size: 16 },
        { value: '.', size: 16 }
      ]
    }, {
      colspan: 1,
      rowspan: 1,
      value: [
        { value: `1`, size: 16 },
        { value: `0`, size: 16 },
        { value: '.', size: 16 }
      ]
    }]
  }]
})

// 模拟checkbox
elementList.push(...<IElement[]>[{
  value: '是否同意以上内容：'
}, {
  type: ElementType.CONTROL,
  control: {
    type: ControlType.CHECKBOX,
    code: '98175',
    value: '',
    valueSets: [{
      value: '同意',
      code: '98175'
    }, {
      value: '否定',
      code: '98176'
    }]
  },
  value: ''
}, {
  value: '\n'
}])

// LaTex公式
elementList.push(...<IElement[]>[{
  value: '医学公式：'
},
{
  value: `f(x) = {{{a_0}} \over 2} + \sum\limits_{n = 1}^\infty {({a_n}\cos {nx} + {b_n}\sin {nx})}`,
  type: ElementType.LATEX
}, {
  value: '\n'
}])

// 模拟结尾文本
elementList.push(...[{
  value: 'E',
  size: 16
}, {
  value: 'O',
  size: 16
}, {
  value: 'F',
  size: 16
}])

export const data: IElement[] = elementList

export const options: IEditorOption = {
  margins: [100, 120, 100, 120],
  header: {
    data: '人民医院门诊'
  },
  watermark: {
    data: 'CANVAS-EDITOR',
    size: 120
  }
}