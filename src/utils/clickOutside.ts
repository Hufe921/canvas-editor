export function clickOutside(
  node: HTMLElement,
  params: { enabled: boolean; callback: (...args: any[]) => unknown }
): void {
  const { enabled = true, callback } = params

  const handleOutsideClick = ({ target }: MouseEvent) => {
    if (!node.contains(target as Node)) callback(node)
  }

  if (enabled) {
    window.addEventListener('click', handleOutsideClick)
  } else {
    window.removeEventListener('click', handleOutsideClick)
  }
}
