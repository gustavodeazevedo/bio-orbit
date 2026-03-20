import React from "react";
import { Download, Eye } from "lucide-react";
import ActionButton from "./ActionButton";
import {
  Stepper,
  StepperDescription,
  StepperIndicator,
  StepperItem,
  StepperTitle,
  StepperTrigger,
} from "./ui/stepper";

const CertificadoCard = ({
  cliente,
  formData,
  fatorZ,
  onVisualizar,
  onDownload,
  onNovoCertificado,
}) => {
  return (
    <div className="w-full min-h-[70vh] flex items-center justify-center px-2 sm:px-4 py-4">
      <div className="w-full max-w-4xl bg-white p-4 sm:p-6 rounded-xl border border-gray-100 shadow-sm">
        <div className="text-center mb-6">
          <div className="inline-flex items-center px-4 py-2 bg-green-100 text-green-800 rounded-full border border-green-200 mb-6">
            <div className="relative flex items-center mr-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-ping"></div>
              <div className="w-2 h-2 bg-green-600 rounded-full absolute"></div>
            </div>
            Certificado Gerado
          </div>
        </div>

        <div className="bg-white border border-gray-100 rounded-lg shadow-sm mb-6 overflow-hidden">
          <div className="text-center py-6 border-b border-gray-50">
            <h2 className="text-2xl font-medium text-gray-900 mb-2">
              Certificado de Calibração
            </h2>
            <p className="text-xl text-gray-500">
              {formData.numeroCertificado}
            </p>
          </div>

          <div className="p-4 sm:p-8">
            <div className="relative overflow-x-auto">
              <div
                className="absolute top-5 stepper-line-animated z-0"
                style={{
                  background:
                    "linear-gradient(90deg, rgb(144, 199, 45), rgb(120, 170, 80), rgb(144, 199, 45))",
                  left: "12.5%",
                  right: "12.5%",
                  transformOrigin: "left center",
                }}
              />
              <div
                className="absolute top-5 stepper-moving-dot z-10"
                style={{
                  left: "12.5%",
                  right: "12.5%",
                }}
              />

              <Stepper
                defaultValue={4}
                className="relative z-10 min-w-[640px] sm:min-w-0"
              >
                <StepperItem step={1}>
                  <StepperTrigger>
                    <StepperIndicator className="border-2" step={1} />
                    <div className="space-y-1 px-2 text-center mt-3">
                      <StepperTitle
                        step={1}
                        style={{ color: "rgb(144, 199, 45)" }}
                      >
                        Cliente
                      </StepperTitle>
                      <StepperDescription
                        step={1}
                        style={{ color: "rgb(75, 120, 25)" }}
                        className="font-medium"
                      >
                        {cliente?.nome || "N/A"}
                      </StepperDescription>
                    </div>
                  </StepperTrigger>
                </StepperItem>

                <StepperItem step={2}>
                  <StepperTrigger>
                    <StepperIndicator className="border-2" step={2} />
                    <div className="space-y-1 px-2 text-center mt-3">
                      <StepperTitle
                        step={2}
                        style={{ color: "rgb(144, 199, 45)" }}
                      >
                        Equipamento
                      </StepperTitle>
                      <StepperDescription
                        step={2}
                        style={{ color: "rgb(75, 120, 25)" }}
                        className="font-medium"
                      >
                        {formData.marcaPipeta} {formData.modeloPipeta}
                      </StepperDescription>
                      <StepperDescription
                        step={2}
                        style={{ color: "rgb(75, 120, 25)" }}
                        className="text-xs"
                      >
                        Série: {formData.numeroPipeta}
                      </StepperDescription>
                    </div>
                  </StepperTrigger>
                </StepperItem>

                <StepperItem step={3}>
                  <StepperTrigger>
                    <StepperIndicator className="border-2" step={3} />
                    <div className="space-y-1 px-2 text-center mt-3">
                      <StepperTitle
                        step={3}
                        style={{ color: "rgb(144, 199, 45)" }}
                      >
                        Condições
                      </StepperTitle>
                      <StepperDescription
                        step={3}
                        style={{ color: "rgb(75, 120, 25)" }}
                        className="font-medium"
                      >
                        {formData.temperatura}°C • {formData.umidadeRelativa}%
                      </StepperDescription>
                      <StepperDescription
                        step={3}
                        style={{ color: "rgb(75, 120, 25)" }}
                        className="text-xs"
                      >
                        Fator Z: {fatorZ.toFixed(4)}
                      </StepperDescription>
                    </div>
                  </StepperTrigger>
                </StepperItem>

                <StepperItem step={4}>
                  <StepperTrigger>
                    <StepperIndicator className="border-2" step={4} />
                    <div className="space-y-1 px-2 text-center mt-3">
                      <StepperTitle
                        step={4}
                        style={{ color: "rgb(144, 199, 45)" }}
                      >
                        Emissão
                      </StepperTitle>
                      <StepperDescription
                        step={4}
                        style={{ color: "rgb(75, 120, 25)" }}
                        className="font-medium"
                      >
                        {new Date().toLocaleDateString("pt-BR")}
                      </StepperDescription>
                      <StepperDescription
                        step={4}
                        style={{ color: "rgb(75, 120, 25)" }}
                        className="text-xs"
                      >
                        {new Date().toLocaleTimeString("pt-BR")}
                      </StepperDescription>
                    </div>
                  </StepperTrigger>
                </StepperItem>
              </Stepper>
            </div>
          </div>
        </div>

        <div className="flex justify-center gap-4 mb-4">
          <ActionButton
            onClick={onVisualizar}
            variant="secondary"
            size="lg"
            icon={Eye}
            className="px-8"
          >
            Visualizar
          </ActionButton>

          <ActionButton
            onClick={onDownload}
            variant="secondary"
            size="lg"
            icon={Download}
            className="px-8"
          >
            Download
          </ActionButton>
        </div>

        <div className="flex justify-center gap-4">
          <ActionButton
            onClick={onNovoCertificado}
            variant="outline"
            size="md"
            className="px-6"
          >
            Novo Certificado
          </ActionButton>
        </div>
      </div>
    </div>
  );
};

export default CertificadoCard;
