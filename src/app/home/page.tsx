"use client";

import NavbarComp from '../../../components/Navbar';

import "bootstrap/dist/css/bootstrap.min.css";
import styles from "./page.module.css";
import { useRouter } from 'next/navigation';
import { useEffect, useState, useContext } from 'react';
import Button from 'react-bootstrap/Button';
import { guard, useRedirect } from '../../../components/Guard';
import toast, { Toaster } from 'react-hot-toast';
import { ToastVariant, ToastColor } from '../../../components/ToastColors';
import Loading from '../../../components/Loading';
import { UserContext } from '../../../context/UserContext';
import { CompanyContext } from '../../../context/CompanyContext';
import { Form, Modal } from 'react-bootstrap';
import Validator from 'validatorjs';
import axios from 'axios';
import Footer from '../../../components/Footer';
import { ApiContext } from '../../../context/ApiContext';
import { WelcomeContext } from '../../../context/WelcomeContext';

function home() {
  const router = useRouter();
  const [toastVariant, setToastVariant] = useState(ToastVariant.DEFAULT);
  const [toastColor, setToastColor] = useState(ToastColor.LIGHT);

  const [loading, setLoading] = useState(false);
  const [loadingStyle, setLoadingStyle] = useState("");

  const [showMessageModal, setShowMessageModal] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const [validated, setValidated] = useState(false);

  const { redirect } = useRedirect();
  const { getPersistAuth, deletePersistAuth } = useContext(UserContext);
  const { deleteCompany } = useContext(CompanyContext);
  const { getJwt, apiKey } = useContext(ApiContext);
  const { unshowWelcomeMessage, getShowWelcomeMessage } = useContext(WelcomeContext);

  const [attItems, setAttItems]: any = useState([])

  const config = {
    headers: {
      "Authorization": "Bearer " + getJwt(),
      "Content-Type": "application/json",
      "apiKey": apiKey,
    }
  }
  const [user, setUser] = useState(getPersistAuth());

  const [newPassword, setNewPassword] = useState("");

  guard();

  async function getAttItems() {
    function compareCreatedAt(a: any, b: any) {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }

    await axios.post(process.env.VERSIONING_SEARCH!, {}, config).then((res) => {
      const results = res.data.result;
      results.sort(compareCreatedAt);

      for (const result of results) {
        if (result.active) {
          const found = user.companyId.some((r: any) => result.companyId.includes(r));
          if (result.global) {
            setAttItems(result.comments);
            break;
          } else if (found) {
            setAttItems(result.comments);
            break;
          }
        } 
      }
    });
  }

  useEffect(() => {
    setUser(getPersistAuth());
    const actualData = new Date();
    const passwordExpirationData = new Date(user.passwordExpiration);

    if (actualData.getTime() > passwordExpirationData.getTime()) {
      setShowModal(true);
      return;
    }

    const welcomeMessage = getShowWelcomeMessage() === "true";
    getAttItems();

    if (welcomeMessage) {
      setShowMessageModal(true);
    }
  }, [])

  function showToast(toastVariant: ToastVariant, toastColor: ToastColor, message: string) {
    setToastVariant(toastVariant);
    setToastColor(toastColor);
    toast(message);
  }

  useEffect(() => {
    if (typeof window !== "undefined") {
      if (window.localStorage.getItem("alert")) {
        const alertMess = JSON.parse(window.localStorage.getItem("alert") || "{}").message;
        const alertVariant = JSON.parse(window.localStorage.getItem("alert") || "{}").type.variant;
        const alertType = JSON.parse(window.localStorage.getItem("alert") || "{}").type.color;
        showToast(alertVariant, alertType, alertMess);
        window.localStorage.removeItem("alert");
      }
    }
  }, []);

  let toastOptions = {
    className: '',
    duration: Number(process.env.TOAST_TIME!),
    style: {
      background: toastVariant,
      color: toastColor,
    }
  }

  const [showPassword, setShowPassword] = useState(false);
  const updatePassword = async (event: any) => {
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
      password: "min:5"
    }
    const infos = {
      username: user.username,
      password: newPassword
    }

    let validation = new Validator(infos, rules);

    if (validation.fails()) {
      let message = '';

      if (validation.errors.get('password').length > 0) {
        message = 'A nova senha deve conter pelo menos 5 caracteres';
      }

      setLoading(false);
      showToast(ToastVariant.ERROR, ToastColor.LIGHT, message);
      return;
    }

    await axios.patch(process.env.USER_UPDATE_PASSWORD!, infos, config).then((res) => {
      setShowModal(false);
      setLoading(false);

      showToast(ToastVariant.SUCCESS, ToastColor.DARK, "Senha atualizada com sucesso");
      if (typeof window !== "undefined") {
        deletePersistAuth();
        deleteCompany();
        router.push("/login");
      }
    }).catch((err) => {
      setLoading(false);
      setShowModal(false);

      showToast(ToastVariant.ERROR, ToastColor.LIGHT, "Não foi possível atualizar a senha");
      const errpayload = {
        username: "Autosys Web",
        content: 'Erro ao atualizar senha do usuário.\n```js\n' + JSON.stringify(err) + '\n```'
      }

      axios.post(process.env.DISCORD_WEBHOOK!, errpayload);
    })
  }

  const home: any = [
    {
      section: "Cliente",
      buttons: [{ url: "/cliente", label: "Cadastrar cliente", color: "primary", icon: "user-plus" },
      { url: "/cliente/buscar", label: "Buscar cliente", color: "secondary", icon: "magnifying-glass" }]
    },

    {
      section: "Veículo",
      buttons: [
        { url: "/veiculo", label: "Cadastrar veículo", color: "primary", icon: "car" },
        { url: "/veiculo/buscar", label: "Buscar veículo", color: "secondary", icon: "magnifying-glass" }
      ]
    },

    {
      section: "Serviço",
      buttons: [
        { url: "/servico", label: "Cadastrar serviço", color: "primary", icon: "clipboard" },
        { url: "/servico/buscar", label: "Buscar serviço", color: "secondary", icon: "magnifying-glass" },
      ]
    }
  ];

  return (
    <>
      {loading ? <Loading setLoadingStyle={setLoadingStyle} /> : ""}

      <div className={loading ? loadingStyle : ""} >
        <NavbarComp />

        <div className="w-100 d-flex justify-content-center">
          <Toaster toastOptions={toastOptions} />
        </div>

        <Modal show={showMessageModal} centered>
          <Modal.Header className="d-flex w-100 justify-content-center">
            <Modal.Title>Novidades 🎉</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <div>
              {attItems.length > 0 ?
                (
                  <ul>
                    {attItems.map((v: any, i: any) => {
                      if (i < 5) return <li className="mt-2">{v}</li>
                    })}
                  </ul>
                ) : (
                  <div className='d-flex justify-content-center'>
                    <strong>Nenhuma novidade ainda.</strong>
                  </div>
                )}
            </div>
          </Modal.Body>
          <Modal.Footer className='d-flex w-100 justify-content-center'>
            <Button variant="primary" size='lg' onClick={() => { unshowWelcomeMessage(); setShowMessageModal(false) }}>Ok</Button>
          </Modal.Footer>
        </Modal>

        <Modal show={showModal} centered>
          <Modal.Header className="d-flex w-100 justify-content-center">
            <Modal.Title>Por favor atualize a sua senha:</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form className="container" onSubmit={updatePassword} noValidate validated={validated}>
              <Form.Label><b>Nova senha:</b></Form.Label>
              <Form.Control type={showPassword ? "text" : "password"} required value={newPassword} onChange={(e) => { setNewPassword(e.target.value) }} placeholder="Nova senha" />
              <Form.Control.Feedback type="invalid">
                Campo obrigatório
              </Form.Control.Feedback>

              <Form.Group className="mt-3" controlId="formBasicCheckbox">
                <Form.Check type="checkbox" checked={showPassword} onChange={(e) => { setShowPassword(e.target.checked) }} label="Mostrar senha" />
              </Form.Group>
              <div className='mt-4 d-flex w-100 justify-content-center'>
                <Button variant="primary" type="submit">
                  Atualizar senha
                </Button>
              </div>
            </Form>
          </Modal.Body>
        </Modal>

        <div className={styles.border}>
          <div className="container">
            {home && home.map((sections: any) => {
              return (
                <div className="row m-auto mt-5 w-100 d-flex justify-content-around">
                  <p className='text-center mt-3 fs-3 border-bottom text-secondary'>{sections.section}</p>
                  {
                    sections.buttons.map((button: any) => {
                      return (
                        <>
                          <div className={`col-md-6 d-flex justify-content-around align-items-center border rounded bg-${button.color} text-light`} style={{ height: "75px", width: "350px", cursor: "pointer" }} onClick={async () => {
                            setLoading(true);
                            const redir = await redirect(button.url, router);

                            if (redir == false) {
                              setLoading(false);
                              showToast(ToastVariant.ERROR, ToastColor.DARK, "Você não possui acesso a este recurso.");
                              return;
                            }

                            else if (redir != false) {
                              redirect(button.url, router);
                            }
                          }}>
                            <i className={`fa-solid fa-${button.icon} fa-2x`}></i>
                            <p className="fs-5 mt-3 text-center">{button.label}</p>
                            <i className="fa-solid fa-chevron-right fa-2x"></i>
                          </div>
                        </>
                      )
                    })
                  }
                </div>
              )
            })}
          </div>
        </div>
      </div>
      {/* <i className="rounded-circle border p-2 bg-white fa-regular fa-newspaper" onClick={() => { setShowMessageModal(true) }} style={{ position: "fixed", fontSize: "50px", cursor: "pointer", bottom: "20px", right: "20px", zIndex: 1000 }}></i> */}
    </>
  );
}

export default home;
