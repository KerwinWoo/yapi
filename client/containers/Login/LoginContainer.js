import React, { PureComponent as Component } from 'react';
import Login from './LoginWrap';
import { Row, Col, Card } from 'antd';

class LoginContainer extends Component {
  render() {
    return (
      <div className="g-body login-body">
        <div className="main-one login-container">
          <div className="container">
            <Row type="flex" justify="center">
              <Col xs={20} sm={16} md={12} lg={8} className="container-login">
                <Card className="card-login">
                  <h2 className="login-title">API协同管理工具</h2>
                  <div className="login-logo">
                    <div className="img"></div>
                  </div>
                  <Login />
                </Card>
              </Col>
            </Row>
          </div>
        </div>
      </div>
    );
  }
}

export default LoginContainer;
