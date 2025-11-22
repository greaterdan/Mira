import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield, Copy, CheckCircle2, Loader2 } from "lucide-react";
import { API_BASE_URL } from "@/lib/apiConfig";

interface TwoFactorSetupModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSetupComplete?: () => void;
}

export const TwoFactorSetupModal = ({
  open,
  onOpenChange,
  onSetupComplete,
}: TwoFactorSetupModalProps) => {
  const [step, setStep] = useState<"setup" | "verify">("setup");
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [success, setSuccess] = useState(false);

  // Fetch 2FA setup data when modal opens
  useEffect(() => {
    if (open && step === "setup") {
      fetchSetupData();
    }
  }, [open, step]);

  const fetchSetupData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`${API_BASE_URL}/api/auth/2fa/setup`, {
        credentials: "include",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to setup 2FA");
      }

      const data = await response.json();
      setQrCode(data.qrCode);
      setSecret(data.manualEntryKey);
    } catch (err: any) {
      setError(err.message || "Failed to setup 2FA");
      console.error("2FA setup error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopySecret = async () => {
    if (!secret) return;
    try {
      await navigator.clipboard.writeText(secret);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const handleVerify = async () => {
    if (!token || !/^\d{6}$/.test(token)) {
      setError("Please enter a valid 6-digit code");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`${API_BASE_URL}/api/auth/2fa/enable`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ token }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Verification failed");
      }

      setSuccess(true);
      setTimeout(() => {
        onOpenChange(false);
        setStep("setup");
        setToken("");
        setQrCode(null);
        setSecret(null);
        setSuccess(false);
        onSetupComplete?.();
      }, 1500);
    } catch (err: any) {
      setError(err.message || "Verification failed");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (loading) return;
    onOpenChange(false);
    // Reset state after modal closes
    setTimeout(() => {
      setStep("setup");
      setToken("");
      setQrCode(null);
      setSecret(null);
      setError(null);
      setSuccess(false);
    }, 300);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Set Up Two-Factor Authentication
          </DialogTitle>
          <DialogDescription>
            {step === "setup"
              ? "Scan the QR code with your authenticator app to get started."
              : "Enter the 6-digit code from your authenticator app to enable 2FA."}
          </DialogDescription>
        </DialogHeader>

        {step === "setup" && (
          <div className="space-y-4">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              </div>
            ) : qrCode ? (
              <>
                <div className="flex flex-col items-center space-y-4">
                  <div className="p-4 bg-white rounded-lg border-2 border-border">
                    <img
                      src={qrCode}
                      alt="2FA QR Code"
                      className="w-48 h-48"
                    />
                  </div>
                  <div className="w-full space-y-2">
                    <Label className="text-xs text-muted-foreground">
                      Or enter this code manually:
                    </Label>
                    <div className="flex items-center gap-2">
                      <Input
                        value={secret || ""}
                        readOnly
                        className="font-mono text-xs"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleCopySecret}
                        className="flex-shrink-0"
                      >
                        {copied ? (
                          <CheckCircle2 className="w-4 h-4" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
                {error && (
                  <div className="text-sm text-destructive text-center">
                    {error}
                  </div>
                )}
              </>
            ) : error ? (
              <div className="text-sm text-destructive text-center py-4">
                {error}
              </div>
            ) : null}

            {qrCode && !error && (
              <div className="space-y-2">
                <Label htmlFor="token" className="text-xs">
                  Enter the 6-digit code from your app:
                </Label>
                <Input
                  id="token"
                  type="text"
                  placeholder="000000"
                  value={token}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, "").slice(0, 6);
                    setToken(value);
                    setError(null);
                  }}
                  className="font-mono text-center text-lg tracking-widest"
                  maxLength={6}
                />
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          {success ? (
            <div className="flex items-center gap-2 text-sm text-green-600 w-full justify-center">
              <CheckCircle2 className="w-4 h-4" />
              <span>2FA enabled successfully!</span>
            </div>
          ) : qrCode && !error ? (
            <div className="flex gap-2 w-full">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={loading}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleVerify}
                disabled={loading || token.length !== 6}
                className="flex-1"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  "Enable 2FA"
                )}
              </Button>
            </div>
          ) : (
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="w-full"
            >
              Close
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

