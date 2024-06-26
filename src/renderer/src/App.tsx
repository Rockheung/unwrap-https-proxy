import React from 'react'
import Versions from './components/Versions'
import * as stylex from '@stylexjs/stylex'

const styles = stylex.create({
  header: {
    display: 'flex',
    height: '50px'
  },
  headerButton: {
    height: '100%',
    width: '50px',
    backgroundColor: 'black',
    color: 'white'
  },
  inputDomain: {
    flex: '1',
    height: '100%',
    padding: '0 10px',
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: 'grey',
    borderRadius: 0,
    outline: 'none'
  },
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

type HttpHeader = {
  name: string
  value: string
}

function App(): JSX.Element {
  const [ip, setIp] = React.useState<Address[]>([])
  const [targetHosts, setTargetHosts] = React.useState<string[]>([])
  const [headers, setHeaders] = React.useState<HttpHeader[]>([])
  console.log('🚀 ~ App ~ headers:', headers)
  const [isProxyEnabled, setIsProxyEnabled] = React.useState<boolean>(false)

  const applyProxy = () => {
    window.electron.ipcRenderer
      .invoke('apply-proxy', {
        targetHosts,
        headers
      })
      .then(() => {
        setIsProxyEnabled(true)
      })
  }

  const deleteHeader = (idx: number) => {
    setHeaders(headers.filter((_, index) => index !== idx))
  }

  const addHeader = () => {
    setHeaders(([...prevHeaders]) => {
      return [...prevHeaders, { name: '', value: '' }]
    })
  }

  const updateIp = () => {
    window.electron.ipcRenderer.invoke('get-ip').then((addresses: Address[]) => {
      setIp(addresses)
    })
  }

  React.useEffect(() => {
    updateIp()
  }, [])

  return (
    <main>
      <header>
        <form {...stylex.props(styles.header)}>
          <button {...stylex.props(styles.headerButton)} type="button">reset</button>
          <button {...stylex.props(styles.headerButton)} type="submit">run</button>
          <input
            {...stylex.props(styles.inputDomain)}
            type="text"
            placeholder="Enter a target domain"
          />
        </form>
      </header>
      {/* <h1>Proxy Address List</h1>
      <form>
        <label>
          Target Hosts:
          <input
            type="text"
            value={targetHosts.join(',')}
            onChange={(e) => setTargetHosts(e.target.value.split(','))}
          />
        </label>
        <div>
          Headers:
          {(headers.length === 0 ? [{ name: '', value: '' }] : headers).map((header, idx) => {
            return (
              <div key={idx} style={{ display: 'flex', flexDirection: 'row' }}>
                <input
                  type="text"
                  name={'key'}
                  value={header.name}
                  onChange={(e) => {
                    setHeaders(([...headers]) => {
                      return [
                        ...headers.slice(0, idx),
                        {
                          ...headers[idx],
                          name: e.target.value
                        },
                        ...headers.slice(idx + 1)
                      ]
                    })
                  }}
                />
                <input
                  type="text"
                  name={'value'}
                  value={header.value}
                  onChange={(e) => {
                    setHeaders(([...headers]) => {
                      return [
                        ...headers.slice(0, idx),
                        {
                          ...headers[idx],
                          value: e.target.value
                        },
                        ...headers.slice(idx + 1)
                      ]
                    })
                  }}
                />
                <button type="button" onClick={() => deleteHeader(idx)}>
                  [X]
                </button>
                <button type="button" onClick={addHeader}>
                  [+]
                </button>
              </div>
            )
          })}
        </div>
        <button type="button" onClick={applyProxy}>
          Apply Proxy
        </button>
        <p>Proxy is {isProxyEnabled ? 'enabled' : 'disabled'}</p>
      </form>
      {ip.map((address) => {
        return (
          <p key={address.name} {...stylex.props(styles.base)}>
            <span {...stylex.props(styles.bold)}>{address.name}</span> Your IP address is:{' '}
            {address.ip}
          </p>
        )
      })}
      <Versions></Versions> */}
    </main>
  )
}

export default App
