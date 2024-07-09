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
  const { getJwt, apiKey } = useContext(ApiContext);

  const config = {
    headers: {
      "Authorization": "Bearer " + getJwt(),
      "Content-Type": "application/json",
      "apiKey": apiKey,
    }
  }

  const [fulluser, setFulluser]: any = useState(getPersistAuth());

  const { setClient } = useContext(ClientContext);

  const [loading, setLoading] = useState(false);
  const [loadingStyle, setLoadingStyle] = useState("");

  async function getPages() {
    await axios.post(process.env.CLIENT_SEARCH!, { active: true, companyId: fulluser.companyId }, config).then((res) => { setPages(res.data.totalPages) }).catch((err) => {
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
      Object.assign(cliente, { del: true, _id: cliente._id });
      setClient(cliente);
      router.push("/cliente/deletar");
    }
  }

  function createVehicle(client: any) {
    setLoading(true);

    Object.assign(client, { fill: true });
    setClient(client);

    if (typeof window !== "undefined") {
      router.push("/veiculo");
    }
  }

  function editClient(cliente: any) {
    setLoading(true);
    if (typeof window !== "undefined") {
      Object.assign(cliente, { edit: true, _id: cliente._id, cep: cliente.address.zipcode, logradouro: cliente.address.place, numero: cliente.address.number, complemento: cliente.address.complement });
      setClient(cliente);
      router.push("/cliente/editar");
    }
  }

  async function searchClient(page: number) {
    const endpoint = process.env.CLIENT_SEARCH!;

    showToast(ToastVariant.SUCCESS, ToastColor.DARK, "Buscando clientes...");
    setLoading(true);
    setClientes([]);
    var clients: any = '';
    if (cpfcnpjName) {
      clients = await axios.post(endpoint, { page, active: true, document: cpfcnpjName.replace(/\D/g, ''), companyId: fulluser.companyId }, config).then((res) => res.data.result).catch((err) => {
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

    function compareNames(a: any, b: any) {
      const nameA = a.name.toUpperCase();
      const nameB = b.name.toUpperCase();

      if (nameA < nameB) {
        return -1;
      }
      if (nameA > nameB) {
        return 1;
      }
      return 0;
    }

    clients.sort(compareNames);

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
    getPages();
    searchClient(1);
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

      <div className="w-100 d-flex justify-content-center">
        <Toaster toastOptions={toastOptions} />
      </div>

      <div className={loading ? loadingStyle : ""} >
        <NavbarComp perms={navbarperms} />

        <h1 className="text-center mt-5">Busca de clientes</h1>

        <Form className="container mt-5">
          <div className="w-100 d-flex flex-line justify-content-center">
            <div className="w-50">
              <Form.Label>CPF/CNPJ</Form.Label>
              <Form.Control as={IMaskInput} mask={[{ mask: '000.000.000-00' }, { mask: '00.000.000/0000-00' }]} value={cpfcnpjName} onChange={(e) => { setCpfcnpjName(e.target.value) }} placeholder="CPF/CNPJ" />
            </div>
            <Button className="mt-auto ms-4 d-flex align-items-center" onClick={() => { searchClient(1) }} variant="primary">
              Buscar
            </Button>
            <Button className="mt-auto ms-4 d-flex align-items-center" onClick={() => { setClientes([]); setCpfcnpjName("") }} variant="warning">
              Limpar
            </Button>
          </div>
          <div className="mt-5 w-100 d-flex flex-line justify-content-center">
            {pages != 0 ? <PaginationComp page={page} setPage={setPage} pages={pages} search={searchClient} /> : ""}
          </div>
        </Form >

        <div className="container mb-5" style={{ minHeight: "300px" }}>
          {clientes.length > 0 && clientes.map((cliente: any) => {
            const birthdayClient = new Date(cliente.birthday);
            let labelData = cliente.document.length > 11 ? "Data de abertura" : "Data de nascimento";

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
                        <Dropdown.Item onClick={() => createVehicle(cliente)}>Cadastrar Veículo</Dropdown.Item>
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
                  <p className="col-md-6"><b>{labelData}:</b> {`${birthdayClient.getUTCDate() < 10 ? "0" + birthdayClient.getUTCDate() : birthdayClient.getUTCDate()}/${birthdayClient.getUTCMonth() + 1 < 10 ? "0" + (birthdayClient.getUTCMonth() + 1).toString() : birthdayClient.getUTCMonth() + 1}/${birthdayClient.getFullYear()}`}</p>
                </div>
                <div className="row mb-2">
                  <p className="col-md-6"><b>E-Mail:</b> {cliente.email || 'Email não cadastrado'}</p>
                  <p className="col-md-6"><b>Telefone:</b> {cliente.phone} {cliente.phoneIsWhatsapp ? <i className={`fa-brands fa-whatsapp`} style={{ "color": "green", }}></i> : ""}</p>
                </div>
                <div className="row">
                  <p className="col-md-6"><b>Endereço:</b> {cliente.address.place}, {cliente.address.number}{cliente.address.complement ? `, ${cliente.address.complement}` : ""}</p>
                  <p className="col-md-6"><b>CEP:</b> {cliente.address && formatarCEP(cliente.address.zipcode)}</p>
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
