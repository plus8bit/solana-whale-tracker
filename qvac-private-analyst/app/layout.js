import "./globals.css";

export const metadata = {
  title: "Private Whale Analyst | QVAC x Solana",
  description: "Local-first Solana wallet intelligence with QVAC inference."
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark">
      <body>{children}</body>
    </html>
  );
}
