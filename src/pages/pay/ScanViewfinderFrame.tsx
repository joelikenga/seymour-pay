import { forwardRef } from 'react'

const cornerClass = 'absolute h-11 w-11 border-yellow-400'

type ScanViewfinderFrameProps = {
  showScanLine?: boolean
}

/** Yellow corner brackets + animated scan line (fills viewfinder slot). */
const ScanViewfinderFrame = forwardRef<HTMLDivElement, ScanViewfinderFrameProps>(
  function ScanViewfinderFrame({ showScanLine = true }, ref) {
    return (
      <div
        ref={ref}
        className="pointer-events-none absolute inset-0 z-10"
        aria-hidden
      >
        {showScanLine ? (
          <div className="pay-scan-viewfinder-track">
            <span className="pay-scan-line" />
          </div>
        ) : null}

        <span
          className={`${cornerClass} left-0 top-0 rounded-tl-sm border-l-[3.5px] border-t-[3.5px]`}
        />
        <span
          className={`${cornerClass} right-0 top-0 rounded-tr-sm border-r-[3.5px] border-t-[3.5px]`}
        />
        <span
          className={`${cornerClass} bottom-0 left-0 rounded-bl-sm border-b-[3.5px] border-l-[3.5px]`}
        />
        <span
          className={`${cornerClass} bottom-0 right-0 rounded-br-sm border-b-[3.5px] border-r-[3.5px]`}
        />
      </div>
    )
  },
)

export default ScanViewfinderFrame
