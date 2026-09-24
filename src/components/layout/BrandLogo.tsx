interface BrandLogoProps {
  placement?: 'header' | 'login'
}

export default function BrandLogo({ placement = 'header' }: BrandLogoProps) {
  return (
    <div
      className={`brand-logo brand-logo--${placement}`}
      aria-label="ShiftPlanner demo"
    >
      ShiftPlanner <span>Demo</span>
    </div>
  )
}
