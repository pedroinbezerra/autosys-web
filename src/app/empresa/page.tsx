"use client";

import "bootstrap/dist/css/bootstrap.min.css";
import { useRouter } from 'next/navigation'
import styles from "./page.module.css";
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import Image from "react-bootstrap/Image";
import NavbarComp from "../../../components/Navbar";
import { guard } from "../../../components/Guard";
import { useRef, useState, useEffect, useContext } from "react";
import { IMaskInput } from "react-imask";
import axios from 'axios';
import Validator from 'validatorjs';
import toast, { Toaster } from 'react-hot-toast';
import Loading from '../../../components/Loading';
import { CompanyContext, getCompany, setCompany } from "../../../context/CompanyContext";
import { UserContext } from "../../../context/UserContext";
import { ApiContext } from "../../../context/ApiContext";
import Footer from "../../../components/Footer";

enum ToastVariant {
  DEFAULT = '#e6e6e6',
  SUCCESS = '#b3ff99',
  ERROR = '#ff6666'
}

enum ToastColor {
  LIGHT = '#fff',
  DARK = '#000000',
}

function painel() {
  const router = useRouter();
  const inputFileRef: any = useRef(null);
  const [toastVariant, setToastVariant] = useState(ToastVariant.DEFAULT);
  const [toastColor, setToastColor] = useState(ToastColor.LIGHT);

  const [profilePhoto, setProfilePhoto]: any = useState("/profile-logo.png");
  const [nome, setNome] = useState("");
  const [observacao, setObservacao] = useState("");

  const [validated, setValidated] = useState(false);

  const [loading, setLoading] = useState(false);
  const [loadingStyle, setLoadingStyle] = useState("");

  const { getPersistAuth, setPersistAuth } = useContext(UserContext);
  const {getJwt, apiKey} = useContext(ApiContext);
  const config = {
    headers:{
      "Authorization": "Bearer "+getJwt(),
      "Content-Type": "application/json",
      "apiKey": apiKey,
    }
  }

  const [usuario, setUsuario]: any = useState(getPersistAuth());
  const [empresa, setEmpresa]: any = useState(getCompany());

  useEffect(() => {
    setUsuario(getPersistAuth());
    setEmpresa(getCompany());
  }, [])

  guard();

  useEffect(() => {
    setLoading(true);
    if (empresa && empresa.image) {
      setProfilePhoto(empresa && empresa.image);
    }

    setNome(empresa && empresa.name);
    setObservacao(empresa && empresa.Observations);
    setLoading(false);
  }, []);

  const [documento, setDocumento] = useState(empresa && empresa.document);

  function showToast(toastVariant: ToastVariant, toastColor: ToastColor, message: string) {
    setToastVariant(toastVariant);
    setToastColor(toastColor);
    toast(message);
  }

  const navbarperms = [
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

  function changePf(e: any) {
    if (typeof URL !== "undefined") {
      if (e.target.files[0]) {
        if (e.target.files[0].size > 3145728) {
          showToast(ToastVariant.ERROR, ToastColor.LIGHT, "A imagem não pode ser maior que 3MB");
          return;
        };

        const file = e.target.files[0];
        const reader = new FileReader();

        reader.addEventListener("load", () => {
          setProfilePhoto(reader.result?.toString());
        });

        reader.readAsDataURL(file);
      }
    }
  }

  async function saveAlterations(event: any) {
    const form = event.currentTarget;
    event.preventDefault();

    setLoading(true);

    if (form.checkValidity() === false) {
      event.stopPropagation();
      setValidated(true);
      setLoading(false);
      return;
    }

    let rules = {
      document: 'size:14',
      name: 'min:5'
    }

    const infos = {
      active: true,
      _id: empresa._id,
      image: profilePhoto,
      document: documento.replace(/\D/g, ""),
      name: nome,
      updatedBy: usuario.username,
      createBy: empresa.username,
      Observations: observacao,
    }

    let validation = new Validator(infos, rules);

    if (validation.fails()) {
      let message = '';

      if (validation.errors.get('document').length > 0) {
        message = 'O documento precisa conter 14 dígitos';
      }

      if (validation.errors.get('name').length > 0) {
        message = 'O nome precisa conter no mínimo 5 letras';
      }

      setLoading(false);
      showToast(ToastVariant.ERROR, ToastColor.LIGHT, message);
      return;
    }

    await axios.patch(process.env.COMPANY!, infos, config)
      .catch((err) => {
        setLoading(false);
        const payload = {
          username: "Autosys Web",
          content: 'Erro ao editar dados da empresa.```js\n' + JSON.stringify(err) + '\n```'
        }

        axios.post(process.env.DISCORD_WEBHOOK!, payload);
      })

    if (typeof window != "undefined") {
      const company = await axios.post(process.env.COMPANY_SEARCH!, { _id: infos._id }, config)
        .then((res) => res.data.result[0])
        .catch((err) => {
          setLoading(false);
          const payload = {
            username: "Autosys Web",
            content: '*Erro ao buscar empresa.*\n```js\n' + JSON.stringify(err) + '\n```'
          }

          axios.post(process.env.DISCORD_WEBHOOK!, payload);
        });
      setCompany(company);
      setLoading(false)
      showToast(ToastVariant.SUCCESS, ToastColor.DARK, 'Dados atualizados');
      setValidated(false);
    }
  }

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
      {loading ? <Loading setLoadingStyle={setLoadingStyle} /> : ""}

      <div className={loading ? loadingStyle : ""} >
        <NavbarComp perms={navbarperms} />

        <div className="w-100 d-flex justify-content-center">
          <Toaster toastOptions={toastOptions} />
        </div>

        <h1 className="text-center mt-5">{nome}</h1>

        <Form className="container mt-5" onSubmit={saveAlterations} noValidate validated={validated}>
          <div className="row mb-4">
            <div className="col-md-4 text-center"></div>
            <div className="col-md-4 text-center">
              <Image className={`${styles.cursorPointer} rounded-circle`} src={profilePhoto} onClick={() => { inputFileRef.current.click() }} width={125} height={123} />
              <input type="file" accept=".jpg, .jpeg, .png" onChange={(e: any) => { changePf(e) }} ref={inputFileRef} style={{ display: "none" }} />
            </div>
            <div className="col-md-4 text-center"></div>
          </div>

          <div className="row">
            <div className="col-md-6">
              <Form.Label><b>Nome da Empresa:</b></Form.Label>
              <Form.Control required value={nome} onChange={(e) => { setNome(e.target.value) }} placeholder="Nome do Usuário" />
              <Form.Control.Feedback type="invalid">
                Campo obrigatório
              </Form.Control.Feedback>
            </div>
            <div className="col-md-6">
              <Form.Label><b>CNPJ:</b></Form.Label>
              <Form.Control required as={IMaskInput} mask="00.000.000/0000-00" value={documento} onChange={(e) => { setDocumento(e.target.value) }} placeholder="Documento" />
              <Form.Control.Feedback type="invalid">
                Campo obrigatório
              </Form.Control.Feedback>
            </div>
          </div>

          <div className="row mt-4">
            <div className="col-md-12">
              <Form.Label><b>Observações:</b></Form.Label>
              <Form.Control value={observacao} onChange={(e) => { setObservacao(e.target.value) }} as="textarea" rows={5} />
            </div>
          </div>

          <div className="mt-5 mb-2 text-center">
            <Button onClick={() => { router.push("/home") }} variant="secondary">
              Cancelar
            </Button>{' '}
            <Button variant="primary" type="submit">
              Salvar
            </Button>
          </div>
        </Form >
      </div >
    </>
  );
}

export default painel;
