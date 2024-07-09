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


enum AlertStatus {
  SHOW = 1,
  HIDE = 0
}

function painel() {
  const router = useRouter();

  const {getPersistAuth, setPersistAuth} = useContext(UserContext);
  const [usuario, setUsuario]: any = useState(getPersistAuth());
  const {getJwt, apiKey} = useContext(ApiContext);

  const config = {
    headers:{
      "Authorization": "Bearer "+getJwt(),
      "Content-Type": "application/json",
      "apiKey": apiKey,
    }
  }

  useEffect(() => {
    setUsuario(getPersistAuth());
  }, [])

  const inputFileRef: any = useRef(null);
  const [toastVariant, setToastVariant] = useState(ToastVariant.DEFAULT);
  const [toastColor, setToastColor] = useState(ToastColor.LIGHT);
  const [profilePhoto, setProfilePhoto]: any = useState("/profile-logo.png");
  const [nome, setNome] = useState("");
  const [validated, setValidated] = useState(false);

  const [loading, setLoading] = useState(false);
  const [loadingStyle, setLoadingStyle] = useState("");

  guard();

  useEffect(() => {
    setLoading(true);
    if (usuario && usuario.profileImage) {
      setProfilePhoto(usuario && usuario.profileImage);
    }

    setNome(usuario && usuario.name);
    setLoading(false);
  }, []);


  const colMd4 = `col-md-4 mt-4 pt-2 d-flex align-items-center`;

  const [endereco, setEndereco] = useState(usuario && usuario.address);
  const [documento, setDocumento] = useState(usuario && usuario.document);
  const [phone, setPhone] = useState(usuario && usuario.phone);
  const [email, setEmail] = useState(usuario && usuario.email);

  const [cep, setCep] = useState(usuario && usuario.cep);
  const [phoneIsWhatsapp, setPhoneIsWhatsapp]: any = useState(usuario && usuario.phoneIsWhatsapp);

  const birthday = new Date(usuario && usuario.birthday);
  const [birthdate, setBirthdate] = useState(`${birthday.getFullYear()}-${birthday.getUTCMonth() + 1 < 10 ? "0" + (birthday.getUTCMonth() + 1).toString() : birthday.getUTCMonth() + 1}-${birthday.getUTCDate() < 10 ? "0" + (birthday.getUTCDate()).toString() : birthday.getUTCDate()}`);

  const EmailMask = /^\S*@?\S*$/;

  function showToast(toastVariant: ToastVariant, toastColor: ToastColor, message: string) {
    setToastVariant(toastVariant);
    setToastColor(toastColor);
    toast(message);
  }

  function changePf(e: any) {
    if (typeof URL !== "undefined") {
      if (e.target.files[0]) {
        if(e.target.files[0].size > 3145728){
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

  const handleCep = (cep: string) => {
    setCep(cep)

    if (cep.length === 9) {
      cep = cep.replace(/[^0-9]/g, '')
      getAddressByCep(cep)
    }
  }

  const getAddressByCep = async (cep: string) => {
    axios
      .get(`https://viacep.com.br/ws/${cep}/json/`)
      .then((res: any) => {
        if (res.data.erro) {
          setCep('')
          setEndereco('')
          showToast(ToastVariant.ERROR, ToastColor.LIGHT, 'CEP inválido')
          return
        }

        setEndereco(`${res.data.logradouro}, ${res.data.bairro}, ${res.data.localidade}-${res.data.uf}`)
      })
      .catch((err: any) => {
        const payload = {
          username: 'Autosys Web',
          content: '**Erro ao buscar CEP**\n```js\n' + JSON.stringify(err) + '\n```',
        }
        axios.post(process.env.DISCORD_WEBHOOK!, payload)
      })
  }

  async function saveAlterations(event: any) {
    setLoading(true);
    const form = event.currentTarget;
    event.preventDefault();

    if (form.checkValidity() === false) {
      event.stopPropagation();
      setValidated(true);
      setLoading(false);
      return;
    }

    let rules = {
      phone: 'digits:11',
      cep: 'size:8',
      document: 'size:11',
      name: 'min:5'
    }

    const infos = {
      _id: usuario._id,
      username: usuario.username,
      profileImage: profilePhoto,
      active: true,
      document: documento.replace(/\D/g, ""),
      name: nome,
      birthday: new Date(birthdate).toISOString(),
      phone: phone.replace(/\D/g, ""),
      phoneIsWhatsapp: phoneIsWhatsapp,
      email: email,
      cep: cep.replace(/\D/g, ""),
      address: endereco,
      permissions: usuario.permissions,
      updatedBy: usuario.username,
      createBy: usuario.username,
    }

    let validation = new Validator(infos, rules);

    if (validation.fails()) {
      let message = '';

      if (validation.errors.get('phone').length > 0) {
        message = 'O número de telefone precisa conter 11 dígitos';
      }

      if (validation.errors.get('cep').length > 0) {
        message = 'O CEP precisa conter 8 dígitos';
      }

      if (validation.errors.get('document').length > 0) {
        message = 'O documento precisa conter 11 dígitos';
      }

      if (validation.errors.get('name').length > 0) {
        message = 'O nome precisa conter no mínimo 5 letras';
      }

      setLoading(false);
      showToast(ToastVariant.ERROR, ToastColor.LIGHT, message);
      return;
    }

    await axios.patch(process.env.USER!, infos, config)
      .then(async () => {
        if (typeof window != "undefined") {
          const fullUser = await axios.post(process.env.USER_SEARCH!, { _id: infos._id }, config).then((res) => res.data.result[0]).catch((err) => {
            setLoading(false);
            const payload = {
              username: "Autosys Web",
              content: '*Erro ao buscar usuário.*\n```js\n' +JSON.stringify(err) + '\n```'
            }
      
            axios.post(process.env.DISCORD_WEBHOOK!, payload);
          });
          setPersistAuth(fullUser);

          setLoading(false);
          setValidated(false);
          showToast(ToastVariant.SUCCESS, ToastColor.DARK, 'Dados atualizados')
        }
      })
      .catch(() => {
        setLoading(false);
        const payload = {
         username: "Autosys Web",
          content: 'Erro ao editar dados do usuário. \nPayload:\n```js\n' + JSON.stringify(infos) + '\n```'
        }

        axios.post(process.env.DISCORD_WEBHOOK!, payload);
      })
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
      { loading ? <Loading setLoadingStyle={setLoadingStyle} /> : ""}

      <div className={loading ? loadingStyle : ""} >
      <NavbarComp />
      
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
            <Form.Label><b>Nome do Usuário:</b></Form.Label>
            <Form.Control required value={nome} onChange={(e) => { setNome(e.target.value) }} placeholder="Nome do Usuário" />
            <Form.Control.Feedback type="invalid">
              Campo obrigatório
            </Form.Control.Feedback>
          </div>
          <div className="col-md-6">
            <Form.Label><b>Email:</b></Form.Label>
            <Form.Control as={IMaskInput} mask={EmailMask} value={email} onChange={(e) => { setEmail(e.target.value) }} placeholder="E-mail" />
          </div>
        </div>

        <div className="row mt-4">
          <div className="col-md-4">
            <Form.Label><b>Data de nascimento:</b></Form.Label>
            <Form.Control required value={birthdate} type="date" onChange={(e) => { setBirthdate(e.target.value) }} placeholder="yyyy/mm/dd" />
            <Form.Control.Feedback type="invalid">
              Campo obrigatório
            </Form.Control.Feedback>
          </div>
          <div className="col-md-4">
            <Form.Label><b>Telefone:</b></Form.Label>
            <Form.Control required as={IMaskInput} mask="(00)00000-0000" value={phone} onChange={(e) => { setPhone(e.target.value) }} placeholder="Telefone" />
            <Form.Control.Feedback type="invalid">
              Campo obrigatório
            </Form.Control.Feedback>
          </div>
          <div className={colMd4}>
            <Form.Check // prettier-ignore
              type='checkbox'
              checked={phoneIsWhatsapp}
              onChange={(e) => { setPhoneIsWhatsapp(e.target.checked) }}
              id='default-checkbox'
              label='Telefone é Whatsapp'
            />
          </div>
        </div>

        <div className="row mt-4">
          <div className="col-md-4">
            <Form.Label><b>Endereço:</b></Form.Label>
            <Form.Control required value={endereco} readOnly  disabled placeholder="Endereço da Empresa" />
            <Form.Control.Feedback type="invalid">
              Campo obrigatório
            </Form.Control.Feedback>
          </div>
          <div className="col-md-4">
            <Form.Label><b>CEP:</b></Form.Label>
            <Form.Control required as={IMaskInput} mask="00000-000" value={cep} onChange={(e) => { handleCep(e.target.value) }} placeholder="CEP" />
            <Form.Control.Feedback type="invalid">
              Campo obrigatório
            </Form.Control.Feedback>
          </div>
          <div className="col-md-4">
            <Form.Label><b>Documento:</b></Form.Label>
            <Form.Control required as={IMaskInput} mask="000.000.000-00" value={documento} onChange={(e) => { setDocumento(e.target.value) }} placeholder="Documento" />
            <Form.Control.Feedback type="invalid">
              Campo obrigatório
            </Form.Control.Feedback>
          </div>
        </div>

        <div className="mt-5 mb-2 text-center">
          <Button onClick={() => { setLoading(true); router.push("/home") }} variant="secondary">
            Cancelar
          </Button>{' '}
          <Button variant="primary" type="submit">
            Salvar
          </Button>
        </div>
      </Form >
      </div>
    </>
  );
}

export default painel;
