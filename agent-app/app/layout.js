import "./globals.css";

export const metadata = {
  title: "Change Detection Agent",
  description: "Trigger-based autonomous web change detection agent",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
