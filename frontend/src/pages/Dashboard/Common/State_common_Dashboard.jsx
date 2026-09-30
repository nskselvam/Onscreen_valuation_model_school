import React, { useState } from "react";
import { Container, Card, Row, Col, Form, Button } from "react-bootstrap";
import { FaMapMarkerAlt, FaGraduationCap, FaArrowRight } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { setRegulationInfo } from "../../../redux-slice/authSlice";
import { useGetDistrictDataQuery } from "../../../redux-slice/GeneralGetSqlOperationApiSlice";
import { toast } from "react-toastify";
import "../../../style/general/general.css";
import { useSelector } from "react-redux";

const State_common_Dashboard = () => {
  const [district, setDistrict] = useState("");
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { data: districtData, error, isLoading } = useGetDistrictDataQuery();
  const districts = districtData?.data || [];
  const { userInfo } = useSelector((state) => state.auth);

  const handleContinue = () => {
    if (district && userInfo.Role == "2") {
      const selected = districts.find((d) => d.DCODE === district);
      dispatch(
        setRegulationInfo({
          district,
          districtName: selected?.DNAME || "",
        }),
      );
      toast.success(`${selected?.DNAME || district} selected successfully!`);
      navigate("/state/dashboard");
    } else if (district && userInfo.Role == "0") {
      const selected = districts.find((d) => d.DCODE === district);
      dispatch(
        setRegulationInfo({
          district,
          districtName: selected?.DNAME || "",
        }),
      );
      toast.success(`${selected?.DNAME || district} selected successfully!`);
      navigate("/state/dashboard");
    }
  };

  if (isLoading) {
    return (
      <div
        style={{
          minHeight: "100%",
          height: "100%",
          background: "transparent",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div>Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          minHeight: "100%",
          height: "100%",
          background: "transparent",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div>
          Error loading districts: {error?.data?.message || error.message}
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100%",
        height: "100%",
        background: "transparent",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Container>
        <Row className="mb-5">
          <Col lg={8} md={10} className="mx-auto">
            <Card
              className="shadow-lg border-0 rounded-4 mb-4"
              style={{ overflow: "hidden" }}
            >
              <Card.Body className="p-5">
                <div className="text-center mb-4">
                  <div
                    style={{
                      display: "inline-block",
                      padding: "15px",
                      borderRadius: "50%",
                      background:
                        "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                      marginBottom: "20px",
                    }}
                  >
                    <FaGraduationCap size={40} color="white" />
                  </div>
                  <h2 className="fw-bold text-primary mb-2">Select District</h2>
                </div>

                <Form.Group className="mb-4">
                  <Form.Label
                    className="fw-bold mb-3"
                    style={{ fontSize: "1.1rem" }}
                  >
                    <FaMapMarkerAlt
                      className="me-2"
                      style={{ color: "#667eea" }}
                    />
                    District
                  </Form.Label>
                  <Form.Select
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    className="form-control"
                    style={{
                      padding: "12px 15px",
                      fontSize: "1rem",
                      borderColor: "#667eea",
                      borderWidth: "2px",
                    }}
                    size="lg"
                  >
                    <option value="">-- Select a District --</option>
                    {districts.map((d) => (
                      <option key={d.id} value={d.DCODE}>
                        {d.DCODE} — {d.DNAME}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>

                <div className="text-center">
                  <Button
                    onClick={handleContinue}
                    disabled={!district}
                    style={{
                      background:
                        "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                      border: "none",
                      padding: "12px 40px",
                      fontSize: "1.1rem",
                      fontWeight: "bold",
                      letterSpacing: "0.5px",
                    }}
                    className="rounded-3"
                  >
                    Continue <FaArrowRight className="ms-2" />
                  </Button>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default State_common_Dashboard;
