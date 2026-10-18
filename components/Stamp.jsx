export default function Stamp({
  src,
  alt = "",
  className = "",
  onWhite = false,
}) {
  return (
    <div className={`stamp ${onWhite ? "stamp-in-white" : ""} ${className}`}>
      <div className="flex aspect-[4/3] items-center justify-center bg-mist">
        {src ? (
          <img
            src={src}
            alt={alt}
            loading="lazy"
            className="h-full w-full object-contain"
          />
        ) : (
          <span className="text-xs text-ink/60">No flag</span>
        )}
      </div>
    </div>
  );
}
