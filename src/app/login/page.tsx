"use client";

import "bootstrap/dist/css/bootstrap.min.css";
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";
import { useContext, useState, useEffect } from "react";
import axios from "axios";
import { useRouter } from 'next/navigation'
import Validator from 'validatorjs';
import toast, { Toaster } from 'react-hot-toast';
import Loading from '../../../components/Loading';
import { UserContext } from "../../../context/UserContext";
import { ToastVariant, ToastColor } from '../../../components/ToastColors';
import { ApiContext } from "../../../context/ApiContext";
import { WelcomeContext } from "../../../context/WelcomeContext";
import './page.module.css'
import { FooterContext } from "../../../context/FooterContext";

function login() {
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== "undefined") {
      if (window.localStorage.getItem("alert")) {
        const alertMess = JSON.parse(window.localStorage.getItem("alert") || "{}").message;
        showToast(ToastVariant.ERROR, ToastColor.LIGHT, alertMess);
        window.localStorage.removeItem("alert");
      }
    }
  }, []);

  const { setPersistAuth, getPersistAuth } = useContext(UserContext);
  const user = getPersistAuth();

  if (user) {
    router.push("/home");
  }


  const [toastVariant, setToastVariant] = useState(ToastVariant.DEFAULT);
  const [toastColor, setToastColor] = useState(ToastColor.LIGHT);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [loadingStyle, setLoadingStyle] = useState("");

  const [time, setTime]: any = useState(process.env.TOAST_TIME!);

  const { setJwt, apiKey } = useContext(ApiContext);
  const {showWelcomeMessage, getShowWelcomeMessage} = useContext(WelcomeContext);
  const {setShowFooter} = useContext(FooterContext);

  useEffect(() => {
    setShowFooter(false);
    return () => setShowFooter(true);
  }, []);

  const config = {
    headers: {
      "apiKey": apiKey,
    }
  }

  function showToast(toastVariant: ToastVariant, toastColor: ToastColor, message: string, time?: number) {
    setToastVariant(toastVariant);
    setToastColor(toastColor);
    toast(message);

    if (time) { setTime(time); }
    else { setTime(Number(process.env.TOAST_TIME!)); }
  }

  useEffect(() => {
    if (typeof window !== "undefined") {
      if (window.localStorage.getItem("alertcompany")) {
        const alertMess = JSON.parse(window.localStorage.getItem("alertcompany") || "{}").message;
        const alertVariant = JSON.parse(window.localStorage.getItem("alertcompany") || "{}").type.variant;
        const alertType = JSON.parse(window.localStorage.getItem("alertcompany") || "{}").type.color;
        showToast(alertVariant, alertType, alertMess, 4000);
        window.localStorage.removeItem("alertcompany");
      }
    }
  }, []);

  const handleSubmit = async (event: any) => {
    setLoading(true);
    const infos = {
      username: username,
      password: password,
      stayMeConnected: true,
    }

    const userData = await axios.post(process.env.USER_SEARCH!, { username }, config).then((res) => {
      return res.data.result[0];
    }).catch();

    if (userData === undefined) {
      setLoading(false);
      showToast(ToastVariant.ERROR, ToastColor.LIGHT, 'O usuário não está cadastrado');
      return;
    }
    else if (userData.companyId.length < 1) {
      setLoading(false);
      showToast(ToastVariant.ERROR, ToastColor.LIGHT, 'O usuário não está atrelado a nenhuma empresa', 3000);
      return;
    }

    const rules = {
      username: 'required',
      password: 'required',
    }

    const validation = new Validator(infos, rules);

    const axiosConfig = {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "apiKey": apiKey
      }
    }

    if (validation.fails()) {
      setLoading(false);
      showToast(ToastVariant.ERROR, ToastColor.LIGHT, 'Usuário ou senha inválido');
      return;
    }

    await axios.post(process.env.LOGIN_AUTH!, { username: username, password: password, stayMeConnected: true }, axiosConfig)
      .then(async (res) => {
        let user: any = await axios.post(process.env.USER_SEARCH!, { username }, config).then((res) => res.data.result[0]).catch((err) => {
          setLoading(false);
          const payload = {
            username: "Autosys Web",
            content: '*Erro ao buscar usuário.*\n```js\n' + JSON.stringify(err) + '\n```'
          }

          axios.post(process.env.DISCORD_WEBHOOK!, payload);
        });

        if (!user.active) {
          setLoading(false);
          showToast(ToastVariant.ERROR, ToastColor.LIGHT, 'Usuário desativado');
          return;
        }

        setPersistAuth(user);
        setJwt(res.data.access_token);
        if (typeof window !== "undefined") {
          if(getShowWelcomeMessage() === '') {
            showWelcomeMessage();
          }
          router.push("/home")
        }
      })
      .catch((err) => {
        let message = 'Usuário ou senha inválido';

        setLoading(false);

        if (err.response.data.message != 'Unauthorized') {
          const payload = {
            username: "Autosys Web",
            // "avatar_url": "https://i.imgur.com/4M34hi2.png",
            content: '*Erro ao fazer login.*\n```js\n' + JSON.stringify(err) + '\n```'
          }

          axios.post(process.env.DISCORD_WEBHOOK!, payload);

          message = 'Erro ao fazer login'
        }

        showToast(ToastVariant.ERROR, ToastColor.LIGHT, message, 3000);
      })
  }

  let toastOptions = {
    className: '',
    duration: time,
    style: {
      background: toastVariant,
      color: toastColor,
    }
  }

  return (
    <>
      {loading ? <Loading setLoadingStyle={setLoadingStyle} /> : ""}

      <div className={loading ? loadingStyle : ""} >
        <div className="w-100 d-flex justify-content-center">
          <Toaster toastOptions={toastOptions} />
        </div>
        <div className="container-fluid h-100 d-flex flex-column justify-content-center align-items-center p-0 overflow-hidden">
          <div className="row w-100">
            <div className="col-md-6 vh-100 d-flex flex-column align-items-between justify-content-around">
              <Form className="container w-75 mb-5">
                <div className="col-md-12 mb-5 d-flex justify-content-start align-items-center">
                  <img src="/favicon.ico" className="me-3" width={55} height={55} />
                  <h1 className="my-auto"><b>Autosys</b></h1>
                </div>
                <div className="row">
                  <Form.Group className="mb-3" controlId="formBasicUsername">
                    <Form.Label><b>Nome de usuário:</b></Form.Label>
                    <Form.Control type="text" placeholder="Nome de usuário" value={username} onChange={({ target }) => { setUsername(target?.value) }} />
                  </Form.Group>
                </div>

                <div className="row">
                  <Form.Group className="mb-3" controlId="formBasicPassword">
                    <Form.Label><b>Senha:</b></Form.Label>
                    <Form.Control type={showPassword ? "text" : "password"} style={{ border: "1 1 1 0" }} placeholder="Senha" value={password} onChange={({ target }) => { setPassword(target?.value) }} />
                  </Form.Group>
                </div>

                <div className="row">
                  <Form.Group className="mb-3" controlId="formBasicCheckbox">
                    <Form.Check type="checkbox" checked={showPassword} onChange={(e) => { setShowPassword(e.target.checked) }} label="Mostrar senha" />
                  </Form.Group>
                </div>

                <div className="row">
                  <Form.Group className="mb-3" controlId="formBasicCheckbox">
                    <Button variant="primary" className="w-100" size="lg" onClick={handleSubmit}>
                      Entrar
                    </Button>
                  </Form.Group>
                </div>

                <a href={"/login/recover"} style={{ textDecoration: "none" }} className="recoverButton w-100 text-secondary"><b>Esqueceu sua senha ?</b></a>
              </Form>
              <div className="w-100">
                <hr className="w-75 m-auto mb-3"></hr>
                <div className="row text-muted">
                  <div className="text-center">
                    Fábrica de Solução em software
                  </div>
                  <div className="text-center">
                    Copyright © {new Date().getFullYear()} | Todos os direitos reservados
                  </div>
                </div>
              </div>
            </div>
            <div className="col-md-6 vh-100 position-relative d-none d-md-flex align-content-center justify-content-center p-0">
              <div className="position-absolute top-0 end-0 w-100 h-100 d-flex justify-content-center align-items-end" style={{ backgroundColor: 'rgba(169, 169, 169, 0.33)' }}>
                <h2 className="mb-5 text-white text-center" style={{ minWidth: "150px", maxWidth: "450px" }}>Seus serviços organizados da maneira que você merece.</h2>
              </div>
              <img src="/example.jpg" className="img-fluid" />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default login;
