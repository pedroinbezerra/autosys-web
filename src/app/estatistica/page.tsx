"use client";

import NavbarComp from '../../../components/Navbar';

import "bootstrap/dist/css/bootstrap.min.css";
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Chart } from "react-google-charts";
import axios from 'axios';
import { guard } from '../../../components/Guard';
import toast, { Toaster } from 'react-hot-toast';
import {ToastVariant, ToastColor} from '../../../components/ToastColors';

function estatistica() {
  const data = [
    ["AAA", "Hours per Day"],
    ["Work", 11],
    ["Eat", 2],
    ["Commute", 2],
  ];
  const router = useRouter();

  const [alertMess, setAlertMess]: any = useState("");
  const [toastVariant, setToastVariant] = useState(ToastVariant.DEFAULT);
  const [toastColor, setToastColor] = useState(ToastColor.LIGHT);

  guard();

  function showToast(toastVariant: ToastVariant, toastColor: ToastColor, message: string) {
    setToastVariant(toastVariant);
    setToastColor(toastColor);
    toast(message);
  }

  useEffect(() => {
    if (typeof window !== "undefined") {
      if (window.localStorage.getItem("alert")) {
        setAlertMess(JSON.parse(window.localStorage.getItem("alert") || "{}").message || "{}");
        window.localStorage.removeItem("alert");
        showToast(ToastVariant.SUCCESS, ToastColor.DARK, alertMess);
      }
    }
  }, []);

  const navbarperms: any = [
    {
      title: "Cliente",
      opts: [
        { label: "Cadastrar", url: "/cliente" },
        { label: "Buscar", url: "/cliente/buscar" },
      ]
    },
    {
      title: "Veículo",
      opts: [
        { label: "Cadastrar", url: "/veiculo" },
        { label: "Buscar", url: "/veiculo/buscar" },
      ]
    },
    {
      title: "Serviço",
      opts: [
        { label: "Cadastrar", url: "/servico" },
        { label: "Buscar", url: "/servico/buscar" },
      ]
    }
  ];
  
  let toastOptions = {
    className: '',
    duration: Number(process.env.TOAST_TIME!),
    style: {
      background: toastVariant,
      color: toastColor,
    }
  }

  return (
    <>
      <NavbarComp perms={navbarperms} />
      <div className="w-100 d-flex justify-content-center">
        <Toaster toastOptions={toastOptions} />
      </div>

      <div className="container mt-5">
        <div className="row">
          <div className="col-md-6">
            <Chart
              chartType="ScatterChart"
              data={[["Age", "Weight"], [4, 5.5], [8, 12]]}
              width="600px"
              height="400px"
              legendToggle
            />
          </div>
          <div className="col-md-6">
            <Chart
              chartType="PieChart"
              data={data}
              width="600px"
              height="500px"
            />
          </div>
        </div>
      </div>
    </>
  );
}

export default estatistica;