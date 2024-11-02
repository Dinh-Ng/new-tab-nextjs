"use client";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export default function DynamicTitle() {
  const [title, setTitle] = useState("xxx");
  const pathname = usePathname();

  useEffect(() => {
    switch (pathname) {
      case "default title":
        setTitle("default title");
        break

      case '/task-manager':
        setTitle("Task manager");
        break

      default:
        setTitle("default title");
        break
    }
  }, [pathname]);

  return <title>{title}</title>;
}
