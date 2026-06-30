"use client";

import { useState } from "react";

export default function FavoriteButton({ courseTitle }) {
  const [saved, setSaved] = useState(false);

  return (
    <button className={saved ? "button saved" : "button"} onClick={() => setSaved(!saved)}>
      {saved ? "已收藏" : `收藏 ${courseTitle}`}
    </button>
  );
}
