import React from "react";

import styles from "@/components/parking-lot-app.module.css";

import { buildLinkedTextSegments } from "../parking-lot-utils";

type DetailDescriptionPreviewProps = {
  details: string;
};

export function DetailDescriptionPreview({ details }: DetailDescriptionPreviewProps) {
  const segments = buildLinkedTextSegments(details);

  return (
    <div className={styles.detailDescriptionPreview}>
      <span className={styles.detailDescriptionPreviewLabel}>Description preview</span>
      <div className={styles.detailDescriptionText}>
        {details
          ? segments.map((segment, index) => {
              if (segment.type === "text") {
                return <React.Fragment key={`detail-text-${index}`}>{segment.value}</React.Fragment>;
              }

              return (
                <a
                  key={`detail-link-${index}`}
                  className={styles.detailDescriptionLink}
                  href={segment.value}
                  target="_blank"
                  rel="noreferrer noopener"
                >
                  {segment.value}
                </a>
              );
            })
          : "No extra details yet."}
      </div>
    </div>
  );
}
