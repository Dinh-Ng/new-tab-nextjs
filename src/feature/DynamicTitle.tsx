"use client";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { findTitle } from "../../utils/findTitle";

export default function DynamicTitle() {
  const [title, setTitle] = useState("xxx");
  const pathname = usePathname();
  console.log('pathname :>> ', pathname);

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
