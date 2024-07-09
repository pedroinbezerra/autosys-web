"use client";

import "bootstrap/dist/css/bootstrap.min.css";
import { useState } from "react";
import styles from "./page.module.css";
import { LineWave } from "react-loader-spinner";

const Loading = (props: any) => {
  props.setLoadingStyle(styles.divLoading);
  return (
    <LineWave
    height="100"
    width="100"
    color="#0a58ca"
    ariaLabel="line-wave"
    wrapperStyle={{}}
    wrapperClass={styles.loadingCenter}
    visible={true}
    firstLineColor=""
    middleLineColor=""
    lastLineColor="" />
  )
}

export default Loading;
