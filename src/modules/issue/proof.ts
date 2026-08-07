import { randomBytes } from "crypto";
import QRCode from "qrcode";
import { prisma } from "@/lib/db";
import { proofUrl } from "@/lib/url";

export function newPublicToken() {
  return randomBytes(18).toString("base64url");
}

export async function getSlipByPublicToken(token: string) {
  return prisma.issueSlip.findUnique({
    where: { publicToken: token },
    include: {
      lines: { include: { item: true } },
      student: true,
      school: true,
      issuedBy: { select: { name: true } },
      voidedBy: { select: { name: true } },
    },
  });
}

export async function qrDataUrlForToken(publicToken: string) {
  return QRCode.toDataURL(proofUrl(publicToken), {
    margin: 1,
    width: 220,
    errorCorrectionLevel: "M",
    color: { dark: "#242424", light: "#ffffff" },
  });
}
