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
  name: string;
  ip: string;
}

function App(): JSX.Element {
  const [ip, setIp] = React.useState<Address[]>([])

  React.useEffect(() => {
    window.electron.ipcRenderer.invoke('get-ip').then((ip: string[]) => {
      console.log("🚀 ~ window.electron.ipcRenderer.invoke ~ ip:", typeof ip)
      setIp(ip)
    })
  }, [])

  return (
    <>
      <h1 className={styles.base}>Hello Electron!</h1>
      {ip.map((address) => {
        return (
          <p key={address.name} className={styles.highlighted}>
            <span className={styles.bold}>{address.name}</span> Your IP address is: {address.ip}
          </p>
        )
      })}

      <Versions></Versions>
    </>
  )
}

export default App
