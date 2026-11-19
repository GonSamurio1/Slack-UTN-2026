import WorkspaceList from '../../Components/WorkspaceList/WorkspaceList';
import Logo from '../../Components/Logo/Logo';
import LogoutButton from '../../Components/LogoutButton/LogoutButton';
import './HomeScreen.css';

/*
Pantalla principal: muestra la lista de espacios de trabajo del usuario
autenticado, con el estilo de sidebar de la referencia de Slack.
*/
function HomeScreen() {

  return (
    <div className="home-screen">
      <aside className="home-screen__panel">
        <nav className="home-screen__tabs">
          <button type="button" className="home-screen__tab home-screen__tab--active">
            Espacios de trabajo
          </button>
          <LogoutButton />
        </nav>
        <Logo size={40} className="home-screen__logo" />
        <h1 className="home-screen__title">Bienvenido a Slack!</h1>
        <section className="home-screen__section">
          <h2 className="home-screen__subtitle">Listo para comenzar</h2>
          <WorkspaceList />
        </section>
      </aside>
    </div>
  )
}

export default HomeScreen
