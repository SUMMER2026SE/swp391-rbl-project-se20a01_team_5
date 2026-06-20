"use client";

import { Scanner } from "@yudiel/react-qr-scanner";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Loader2, QrCode } from "lucide-react";
import { ExpressiveButton } from "@/components/m3/primitives";

export function QrScannerModal({
  open,
  onOpenChange,
  onScan,
  isLoading,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onScan: (result: string) => void;
  isLoading?: boolean;
}) {
  return (
    <Dialog open={open} onOpenChange={(val) => {
      // Prevent closing if loading
      if (isLoading && !val) return;
      onOpenChange(val);
    }}>
      <DialogContent className="max-w-md p-0 overflow-hidden bg-black border-none gap-0 sm:rounded-3xl h-[100dvh] sm:h-auto flex flex-col">
        <DialogTitle className="sr-only">Quét mã QR</DialogTitle>
        <div className="relative flex-1 w-full bg-black min-h-[60vh]">
          {open && (
            <Scanner
              onScan={(result) => {
                if (Array.isArray(result) && result.length > 0 && result[0].rawValue) {
                  onScan(result[0].rawValue);
                }
              }}
              onError={(error) => console.error("Scanner Error:", error)}
              formats={["qr_code"]}
              components={{
                audio: true,
                onOff: false,
                torch: true,
                zoom: true,
                finder: true,
              }}
              styles={{
                container: { width: "100%", height: "100%" },
              }}
            />
          )}

          <div className="pointer-events-none absolute inset-x-0 top-0 bg-gradient-to-b from-black/80 via-black/40 to-transparent p-6 pb-20 flex justify-between items-start z-10">
            <div className="text-white">
              <h2 className="font-bold text-xl flex items-center gap-2"><QrCode className="size-6" /> Quét vé xe</h2>
              <p className="text-sm text-white/80 font-medium">Đưa camera vào mã QR của sinh viên</p>
            </div>
          </div>

          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-8 pt-20 flex justify-center z-10">
            <ExpressiveButton 
              variant="tonal" 
              onClick={() => onOpenChange(false)} 
              disabled={isLoading}
              className="bg-white/10 text-white hover:bg-white/20 border border-white/20 backdrop-blur-xl shadow-2xl h-12 px-8 text-base"
            >
              Đóng Camera
            </ExpressiveButton>
          </div>

          {isLoading && (
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center text-white z-50">
              <Loader2 className="size-12 animate-spin text-[#beff50] drop-shadow-lg" />
              <p className="mt-4 font-bold text-lg tracking-tight">Đang kiểm tra vé...</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
