import React from 'react'
import Versions from './components/Versions'
import * as stylex from '@stylexjs/stylex'

const styles = stylex.create({
  base: {
    fontSize: 16,
    lineHeight: 1.5,
    color: 'grey'
  },
  bold: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'red'
  },
  highlighted: {
    color: 'rebeccapurple'
  }
})

type Address = {
  name: string
  ip: string
}

function App(): JSX.Element {
  const [ip, setIp] = React.useState<Address[]>([])

  const updateIp = () => {
    window.electron.ipcRenderer.invoke('get-ip').then((addresses: Address[]) => {
      setIp(addresses)
    })
  }

  React.useEffect(() => {
    updateIp()
  }, [updateIp])

  return (
    <main>
      <h1>Proxy Address List</h1>
      <button onClick={updateIp}>새로고침</button>
      {ip.map((address) => {
        return (
          <p key={address.name} {...stylex.props(styles.base)}>
            <span {...stylex.props(styles.bold)}>{address.name}</span> Your IP address is:{' '}
            {address.ip}
          </p>
        )
      })}
      <Versions></Versions>
    </main>
  )
}

export default App
