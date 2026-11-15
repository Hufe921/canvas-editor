export enum ListType {
  UL = 'ul',
  OL = 'ol'
}

export enum UlStyle {
  DISC = 'disc', // 实心圆点
  CIRCLE = 'circle', // 空心圆点
  SQUARE = 'square', // 实心方块
  CHECKBOX = 'checkbox', // 复选框
  DIAMOND = 'diamond',       // 菱形
  ARROW = 'arrow',          // 箭头
  DIAMOND_FLORAL = 'diamond-floral', // 菱形梅花瓣 
  HALF_ARROW = 'half-arrow',     // 黑白各一半的箭头 (3D立体箭头)
  CHECKMARK = 'checkmark',     // 对勾
  DIAMOND_HOLLOW = 'diamond-hollow', // 空心菱形
}

export enum OlStyle {
  DECIMAL = 'decimal', // 阿拉伯数字
  DECIMAL_PARENTHESES = 'decimal_parentheses', // 带括号的阿拉伯数字 (1) (2)
  DECIMAL_RIGHT_PAREN = 'decimal_right_paren', // 带右括号的阿拉伯数字 1) 2)
  UPPER_ALPHA = 'upper_alpha', // 大写字母 A. B. C.
  LOWER_ALPHA = 'lower_alpha', // 小写字母 a. b. c.
  CIRCLED_DECIMAL = 'circled_decimal', // 带圈的数字 ① ② ③
  CHINESE = 'chinese', // 中文数字
  CHINESE_PARENTHESES = 'chinese_parentheses' // 带括号的中文数字
}

export enum ListStyle {
  DISC = UlStyle.DISC,
  CIRCLE = UlStyle.CIRCLE,
  SQUARE = UlStyle.SQUARE,
  DECIMAL = OlStyle.DECIMAL,
  DECIMAL_PARENTHESES = OlStyle.DECIMAL_PARENTHESES,
  DECIMAL_RIGHT_PAREN = OlStyle.DECIMAL_RIGHT_PAREN,
  UPPER_ALPHA = OlStyle.UPPER_ALPHA,
  LOWER_ALPHA = OlStyle.LOWER_ALPHA,
  CIRCLED_DECIMAL = OlStyle.CIRCLED_DECIMAL,
  CHINESE = OlStyle.CHINESE,
  CHINESE_PARENTHESES = OlStyle.CHINESE_PARENTHESES,
  CHECKBOX = UlStyle.CHECKBOX,

  DIAMOND = UlStyle.DIAMOND, 
  ARROW = UlStyle.ARROW,
  DIAMOND_FLORAL = UlStyle.DIAMOND_FLORAL,
  HALF_ARROW = UlStyle.HALF_ARROW,
  CHECKMARK = UlStyle.CHECKMARK,
  DIAMOND_HOLLOW = UlStyle.DIAMOND_HOLLOW,
}
