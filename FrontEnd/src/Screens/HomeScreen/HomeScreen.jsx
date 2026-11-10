import WorkspaceList from '../../Components/WorkspaceList/WorkspaceList';

function HomeScreen() {

  return (
    <div>
      <h1>Bienvenido a Slack!</h1>
      <div>
        <h2>Lista de tus espacios de trabajo:</h2>
        <WorkspaceList />
      </div>
    </div>
  )
}

export default HomeScreen