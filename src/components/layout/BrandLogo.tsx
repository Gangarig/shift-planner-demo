interface BrandLogoProps {
  placement?: 'header' | 'login'
}

export default function BrandLogo({ placement = 'header' }: BrandLogoProps) {
  return (
    <img
      className={`brand-logo brand-logo--${placement}`}
      aria-label="ShiftPlanner demo"
      alt="ShiftPlanner Demo"
      src={`${import.meta.env.BASE_URL}shiftplanner-demo-logo.png`}
    />
  )
}
