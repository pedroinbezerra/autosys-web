"use client";

import "bootstrap/dist/css/bootstrap.min.css";
import { useRouter } from 'next/navigation'
import { useEffect, useState, useContext } from "react";
import axios from "axios";
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import NavbarComp from "../../../../components/Navbar";
import Dropdown from 'react-bootstrap/Dropdown';
import { guard } from "../../../../components/Guard";
import { IMaskInput } from "react-imask";
import toast, { Toaster } from 'react-hot-toast';
import { ToastVariant, ToastColor } from '../../../../components/ToastColors';
import PaginationComp from '../../../../components/Pagination';
import Loading from '../../../../components/Loading';
import { ClientContext } from "../../../../context/ClientContext";
import { UserContext } from "../../../../context/UserContext";
import { ApiContext } from "../../../../context/ApiContext";
import Footer from "../../../../components/Footer";

function buscarCliente() {
  const router = useRouter();
  const [toastVariant, setToastVariant] = useState(ToastVariant.DEFAULT);
  const [toastColor, setToastColor] = useState(ToastColor.LIGHT);
  const [pages, setPages] = useState(0);
  const [page, setPage] = useState(1);

  const { getPersistAuth } = useContext(UserContext);

  const [fulluser, setFulluser]: any = useState(getPersistAuth());
  const { getJwt, apiKey } = useContext(ApiContext);
  const config = {
    headers: {
      "Authorization": "Bearer " + getJwt(),
      "Content-Type": "application/json",
      "apiKey": apiKey,
    }
  }

  const { setClient } = useContext(ClientContext);

  const [loading, setLoading] = useState(false);
  const [loadingStyle, setLoadingStyle] = useState("");

  async function getPages() {
    await axios.post(process.env.CLIENT_SEARCH!, { active: true }, config).then((res) => { setPages(res.data.totalPages) }).catch((err) => {
      const payload = {
        username: "Autosys Web",
        content: '*Erro ao buscar cliente.*\n```js\n' + JSON.stringify(err) + '\n```'
      }

      axios.post(process.env.DISCORD_WEBHOOK!, payload);
    });
  }

  guard();

  function showToast(toastVariant: ToastVariant, toastColor: ToastColor, message: string) {
    setToastVariant(toastVariant);
    setToastColor(toastColor);
    toast(message);
  }

  useEffect(() => {
    if (typeof window !== "undefined") {
      if (window.localStorage.getItem("alert")) {
        const alertMess = JSON.parse(window.localStorage.getItem("alert") || "{}").message;
        showToast(ToastVariant.SUCCESS, ToastColor.DARK, alertMess);
        window.localStorage.removeItem("alert");
      }
    }
  }, []);

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
  const [cpfcnpjName, setCpfcnpjName] = useState('');
  const [clientes, setClientes]: any = useState([]);

  function deleteClient(cliente: any) {
    setLoading(true);
    if (typeof window !== "undefined") {
      Object.assign(cliente, { _id: cliente._id });
      setClient(cliente);
      router.push("/cliente/deletar");
    }
  }

  function editClient(cliente: any) {
    setLoading(true);
    if (typeof window !== "undefined") {
      if (cliente.address.split(",").length == 3) {
        Object.assign(cliente, { _id: cliente._id, logradouro: cliente.address.split(",")[0].trim(), numero: cliente.address.split(",")[1].trim(), complemento: cliente.address.split(",")[2].trim() });
      }
      if (cliente.address.split(",").length == 2) {
        Object.assign(cliente, { _id: cliente._id, logradouro: cliente.address.split(",")[0].trim(), numero: cliente.address.split(",")[1].trim(), complemento: "" });
      }
      setClient(cliente);
      router.push("/cliente/editar");
    }
  }

  async function searchClient(page: number) {
    const endpoint = process.env.CLIENT_SEARCH!;

    setLoading(true);
    setClientes([]);
    var clients: any = '';
    if (cpfcnpjName) {
      clients = await axios.post(endpoint, { page, active: true, document: cpfcnpjName, companyId: fulluser.companyId }, config).then((res) => res.data.result).catch((err) => {
        setLoading(false);
        const payload = {
          username: "Autosys Web",
          content: '*Erro ao buscar cliente.*\n```js\n' + JSON.stringify(err) + '\n```'
        }

        axios.post(process.env.DISCORD_WEBHOOK!, payload);
      });
    } else {
      clients = await axios.post(endpoint, { page, active: true, companyId: fulluser.companyId }, config).then((res) => res.data.result).catch((err) => {
        setLoading(false);
        const payload = {
          username: "Autosys Web",
          content: '*Erro ao buscar cliente.*\n```js\n' + JSON.stringify(err) + '\n```'
        }

        axios.post(process.env.DISCORD_WEBHOOK!, payload);
      });
    }

    showToast(ToastVariant.SUCCESS, ToastColor.DARK, "Buscando clientes...");
    setClientes(clients);
    setLoading(false);
  }

  let toastOptions = {
    className: '',
    duration: Number(process.env.TOAST_TIME!),
    style: {
      background: toastVariant,
      color: toastColor,
    }
  }

  useEffect(() => {
    searchClient(1);
    getPages();
  }, [])

  function formatCnpjCpf(cnpjCpf: string) {
    if (cnpjCpf.length === 11) {
      return cnpjCpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/g, "\$1.\$2.\$3-\$4");
    }
    return cnpjCpf.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/g, "\$1.\$2.\$3/\$4-\$5");
  }

  function formatarCEP(cep: string) {
    var re = /^([\d]{2})\.*([\d]{3})-*([\d]{3})/;
    return cep.replace(re, "$1$2-$3");
  }

  return (
    <>
      {loading ? <Loading setLoadingStyle={setLoadingStyle} /> : ""}

      <div className={loading ? loadingStyle : ""} >
        <NavbarComp perms={navbarperms} />

        <h1 className="text-center mt-5">Busca de clientes</h1>

        <div className="w-100 d-flex justify-content-center">
          <Toaster toastOptions={toastOptions} />
        </div>

        <Form className="container mt-5">
          <div className="w-100 d-flex flex-line justify-content-center">
            <div className="w-50">
              <Form.Label>CPF/CNPJ</Form.Label>
              <Form.Control as={IMaskInput} mask="000.000.000-00" value={cpfcnpjName} onChange={(e) => { setCpfcnpjName(e.target.value) }} placeholder="CPF/CNPJ" />
            </div>
            <Button className="mt-auto ms-4 d-flex align-items-center" onClick={() => { searchClient(1) }} variant="primary">
              Buscar
            </Button>
          </div>
          <div className="mt-5 w-100 d-flex flex-line justify-content-center">
            {pages != 0 ? <PaginationComp page={page} setPage={setPage} pages={pages} search={searchClient} /> : ""}
          </div>
        </Form >

        <div className="container mb-5" style={{ minHeight: "300px" }}>
          {clientes.length > 0 && clientes.map((cliente: any) => {
            const birthdayClient = new Date(cliente.birthday);
            return (
              <div key={cliente._id} className="container border m-3 mt-5 p-3 w-auto rounded shadow">
                <div className="w-100 d-flex flex-line justify-content-between">
                  <h4 className="mt-2">{cliente.name}</h4>
                  <div>
                    <Dropdown>
                      <Dropdown.Toggle variant="success" id="dropdown-basic">
                        Opções
                      </Dropdown.Toggle>
                      <Dropdown.Menu>
                        <Dropdown.Item onClick={() => { if (typeof navigator != "undefined") navigator.clipboard.writeText(cliente._id) }}>Copiar ID do Cliente</Dropdown.Item>
                        <Dropdown.Item onClick={() => editClient(cliente)}>Editar</Dropdown.Item>
                        <hr />
                        <Dropdown.Item onClick={() => deleteClient(cliente)}>Deletar</Dropdown.Item>
                      </Dropdown.Menu>
                    </Dropdown>
                  </div>
                </div>
                <hr />
                <div className="row mb-2">
                  <p className="col-md-6"><b>CPF/CNPJ:</b> {formatCnpjCpf(cliente.document)}</p>
                  <p className="col-md-6"><b>Data de Nascimento:</b> {`${birthdayClient.getUTCDate() + 1 < 10 ? "0" + birthdayClient.getUTCDate() : birthdayClient.getUTCDate()}/${birthdayClient.getUTCMonth() + 1 < 10 ? "0" + (birthdayClient.getUTCMonth() + 1).toString() : birthdayClient.getUTCMonth() + 1}/${birthdayClient.getFullYear()}`}</p>
                </div>
                <div className="row mb-2">
                  <p className="col-md-6"><b>E-Mail:</b> {cliente.email || 'Email não cadastrado'}</p>
                  <p className="col-md-6"><b>Telefone:</b> {cliente.phone} {cliente.phoneIsWhatsapp ? "(Whatsapp)" : ""}</p>
                </div>
                <div className="row">
                  <p className="col-md-6">{cliente.address}</p>
                  <p className="col-md-6"><b>CEP:</b> {formatarCEP(cliente.cep)}</p>
                </div>
              </div>
            )
          })}
        </div >

        <div className="mt-5 w-100 d-flex flex-line justify-content-center">
          {pages != 0 ? <PaginationComp page={page} setPage={setPage} pages={pages} search={searchClient} /> : ""}
        </div>
      </div>
    </>
  );
}

export default buscarCliente;
