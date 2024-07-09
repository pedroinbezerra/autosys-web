import "bootstrap/dist/css/bootstrap.min.css";
import Navbar from 'react-bootstrap/Navbar';
import NavDropdown from 'react-bootstrap/NavDropdown';
import Nav from 'react-bootstrap/Nav';
import Container from 'react-bootstrap/Container';
import Image from 'next/image'
import styles from "./main.module.css";
import { useRouter } from 'next/navigation'
import { useEffect, useState, useContext } from "react";
import { useRedirect, useClearStorage, useCheckURL, guard } from '../Guard/';
import axios from "axios";
import { UserContext } from "../../context/UserContext";
import { CompanyContext } from "../../context/CompanyContext";
import toast, { Toaster } from 'react-hot-toast';
import { ToastVariant, ToastColor } from '../ToastColors';
import { ApiContext } from "../../context/ApiContext";
import { WelcomeContext } from "../../context/WelcomeContext";

interface Perms {
  title: string;
  icon: {
    name: string,
    color: string,
  }
  opts: [
    {
      label: string,
      url: string
    }
  ]
}

const NavbarComp = (props: { perms?: any }) => {
  const logout = () => {
    deletePersistAuth();
    deleteCompany();
    deleteJwt();
    if (typeof window !== "undefined") {
      router.push("/login");
      return;
    }
  }

  const navbarperms: any = [
    {
      title: "Empresa",
      icon: {
        name: "building",
        color: "white",
      },
      opts: [
        { label: "Empresa", url: "/empresa" }
      ]
    },
    {
      title: "Cliente",
      icon: {
        name: "user",
        color: "white",
      },
      opts: [
        { label: "Cadastrar", url: "/cliente" },
        { label: "Buscar", url: "/cliente/buscar" },
      ]
    },
    {
      title: "Veículo",
      icon: {
        name: "car",
        color: "white",
      },
      opts: [
        { label: "Cadastrar", url: "/veiculo" },
        { label: "Buscar", url: "/veiculo/buscar" },
      ]
    },
    {
      title: "Serviço",
      icon: {
        name: "briefcase",
        color: "white",
      },
      opts: [
        { label: "Cadastrar", url: "/servico" },
        { label: "Buscar", url: "/servico/buscar" },
      ]
    }
  ];

  guard();

  const router = useRouter();
  const { redirect } = useRedirect();
  const { clearStorage } = useClearStorage();
  const { checkURL } = useCheckURL();
  const { deleteJwt, getJwt, apiKey } = useContext(ApiContext);

  const config = {
    headers: {
      "Authorization": "Bearer " + getJwt(),
      "Content-Type": "application/json",
      "apiKey": apiKey,
    }
  }

  const [perms, setPerms]: any = useState(navbarperms);
  const [profileImage, setProfileImage] = useState("/profile-logo.png");
  const [usuario, setUsuario]: any = useState("");
  const [company, setFullcompany]: any = useState("");

  const { getPersistAuth, deletePersistAuth } = useContext(UserContext);

  const { getCompany, setCompany, deleteCompany } = useContext(CompanyContext);

  const [showNovidades, setShowNovidades]: any = useState(false);


  async function getCompanyInfos(companyId: string) {
    setFullcompany(getCompany());
    if (typeof window !== "undefined") {
      if (getJwt() != null) {
        await axios.post(process.env.COMPANY_SEARCH!, { _id: companyId }, config).then(res => {
          setCompany(res.data.result[0]);
          setFullcompany(getCompany());

        }).catch((err) => {
          const payload = {
            username: "Autosys Web",
            content: '*Erro ao obter as informações da empresa.*\n```js\n' + JSON.stringify(err) + '\n```'
          }
          axios.post(process.env.DISCORD_WEBHOOK!, payload);
        });
      }
    }
  }

  const [showCompany, setShowCompany] = useState(false)
  async function handleshowCompany(userId: any) {
    if (getJwt() != null) {
      const permission = await axios.post(process.env.USER_PERMISSIONS!, { _id: userId, route: "/empresa" }, config).then((res) => res.data).catch((err) => {
        const payload = {
          username: "Autosys Web",
          content: '*Erro ao verificar permissão do usuário.*\n```js\n' + JSON.stringify(err) + '\n```'
        }

        axios.post(process.env.DISCORD_WEBHOOK!, payload);
      });

      permission ? setShowCompany(true) : setShowCompany(false);
    }
  }

  async function checkShowNovidades() {
    const isEnable = await checkURL("/novidades");

    if (isEnable == true) {
      setShowNovidades(true);
      return;
    }

    setShowNovidades(false);
  }

  useEffect(() => {
    if (typeof window != "undefined") {
      const user = getPersistAuth()
      setUsuario(user);

      if (user && user?.companyId.length < 1) {
        window.localStorage.setItem("alertcompany", JSON.stringify({ type: { variant: ToastVariant.ERROR, color: ToastColor.LIGHT }, message: "O usuário não está atrelado a nenhuma empresa" }));
        logout();
        return;
      }

      if (user && user.profileImage) {
        setProfileImage(user && user.profileImage);
      }

      checkShowNovidades();

      getCompanyInfos(user && user.companyId[0]);
      handleshowCompany(user && user._id);
    }
  }, [])

  return (
    <Navbar bg="dark" variant="dark" expand="lg">
      <Container>
        <Navbar.Brand onClick={() => { clearStorage(); router.push("/home"); }} className={styles.cursorPointer}>
          {company && company.image ? <img
            alt=""
            src={company.image}
            width="30"
            height="30"
            className="d-inline-block align-top me-2 rounded-circle"
          /> : ""}
          {company && company.name ? company.name : ""}
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto">
            {/* <Nav.Link onClick={() => { clearStorage(); router.push("/home"); }}>Home</Nav.Link> */}
            {perms.length > 0 ? perms.map((opt: any) => {
              if (opt.opts && opt.opts.length > 1) {
                return (
                  <NavDropdown title={<span>
                    {opt.icon ? <i className={`fa-regular fa-solid fa-${opt.icon.name} me-2`} style={{ "color": opt.icon.color }}></i> : ""}
                    {opt.title}
                  </span>
                  } id="basic-nav-dropdown">
                    {opt.opts && opt.opts.length > 1 ? (
                      opt.opts.map((subOpt: any) => {
                        return (
                          <NavDropdown.Item onClick={() => { redirect(subOpt.url, router) }}>{subOpt.label}</NavDropdown.Item>
                        )
                      })
                    ) : ""}
                  </NavDropdown>
                )
              }
              else if (opt.opts && opt.opts.length == 1) {
                return (
                  <>
                    {opt.opts && opt.opts.length == 1 ? (
                      opt.opts.map((subOpt: any) => {
                        return <Nav.Link onClick={() => { redirect(subOpt.url, router); }}> {opt.icon ? <i className={`fa-regular fa-solid fa-${opt.icon.name} me-2`} style={{ "color": opt.icon.color }}></i> : ""}{subOpt.label}</Nav.Link>;
                      })
                    ) : ""}
                  </>
                )
              }
            }) : ""}
          </Nav>
        </Navbar.Collapse>
        <Navbar.Collapse className="justify-content-end">
          <div className="d-flex align-self-end justify-items-start">
            <NavDropdown title={<Image className={styles.homeUserDashboard} width={50} height={50} src={profileImage} alt="painel" />} id="basic-nav-dropdown">
              <NavDropdown.Item onClick={() => { redirect("/painel", router); }}>Meu perfil</NavDropdown.Item>
              {showNovidades ? <NavDropdown.Item onClick={() => { router.push("/novidades"); }}>Novidades</NavDropdown.Item> : ""}
              <NavDropdown.Item onClick={logout}>Sair</NavDropdown.Item>
            </NavDropdown>
          </div>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  )
}

export default NavbarComp;
