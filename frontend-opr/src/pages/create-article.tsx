import Head from "next/head";
import { LayoutSigned } from "@/components/layout";
import { SubmitHandler, useForm } from "react-hook-form";
import { useDropzone } from "react-dropzone";
import { toast } from "react-toastify";
import * as yup from "yup";
import {
  Flex,
  Button,
  useBoolean,
  Text,
  Textarea,
  Box,
} from "@chakra-ui/react";
import { Input, InputError } from "@/components/input";
import authRoute from "@/utils/auth";
import { useAuth } from "context";
import { yupResolver } from "@hookform/resolvers/yup";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import Select from "react-select";
import fetchData from "@/utils/fetch";
import { EventProps } from "common/types/event";

const schema = yup.object().shape({
  name: yup.string().required("Nome é obrigatório"),
  description: yup.string().required("Descrição é obrigatório"),
});

type Inputs = {
  name: string;
  description: string;
};

type SelectProps = {
  value: string;
  label: string;
};

const CreateArticle = () => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Inputs>({
    mode: "onSubmit",
    resolver: yupResolver(schema),
  });
  const { user } = useAuth();
  const router = useRouter();
  const { acceptedFiles, getRootProps, getInputProps } = useDropzone({
    accept: "application/pdf",
  });
  const [isLoading, setIsLoading] = useBoolean(false);
  const [acceptedFilesManager, setAcceptedFilesManager] = useState<File[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<SelectProps>();
  const [events, setEvents] = useState<SelectProps[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const apiResponse = await fetchData("GET", "event");
        const formattedResponse = apiResponse
          .filter(
            (event: EventProps) =>
              event.endDate >= new Date().toISOString().split("T")[0]
          )
          .map((event: EventProps) => ({
            value: event.id,
            label: `${event.name} - [${event.startDate.split("T")[0]} | ${
              event.endDate.split("T")[0]
            }]`,
          }));
        setEvents(formattedResponse);
      } catch (error) {
        toast.error("Ocorreu um erro ao buscar os eventos, tente novamente!", {
          autoClose: 5000,
        });
      }
    })();
  }, []);

  useEffect(() => {
    setAcceptedFilesManager(acceptedFiles);
  }, [acceptedFiles, acceptedFiles.length]);

  const onSubmit: SubmitHandler<Inputs> = async (data) => {
    try {
      if (!acceptedFilesManager[0]) {
        toast.error("O arquivo é obrigatório!", {
          autoClose: 5000,
        });
        return;
      }

      if (!selectedEvent) {
        toast.error("O evento é obrigatório!", {
          autoClose: 5000,
        });
        return;
      }

      setIsLoading.on();

      let reader = new FileReader();
      reader.readAsDataURL(acceptedFilesManager[0]);

      reader.onload = async () => {
        const fileResult = reader.result as string;

        await fetchData("POST", "article", {
          creator: user.id,
          name: data.name,
          description: data.description,
          file: fileResult.replace("data:application/pdf;base64,", ""),
          event: selectedEvent.value,
        });

        toast.success("Artigo submetido com sucesso!", {
          autoClose: 5000,
        });

        router.replace("/articles");
      };
    } catch {
      toast.error("Ocorreu ao submeter o artigo, tente novamente!", {
        autoClose: 5000,
      });
    } finally {
      setIsLoading.off();
    }
  };

  return (
    <LayoutSigned>
      <Head>
        <title>Criar artigo</title>
        <meta name="viewport" content="initial-scale=1.0, width=device-width" />
      </Head>

      <Flex
        as="form"
        width="80%"
        padding="1rem"
        direction="column"
        onSubmit={handleSubmit(onSubmit)}
      >
        <Flex align="flex-start" direction="column">
          <Text
            width="100%"
            textAlign="center"
            margin="1rem 0 3rem 0"
            fontSize="1.5rem"
            fontWeight="bold"
          >
            Dados do artigo
          </Text>

          <Flex justify="flex-start" wrap="wrap" w="100%" mb="0.3125rem">
            <Flex
              flex={1}
              direction="column"
              mr={{ base: "0", sm: "1rem" }}
              minW="13.75rem"
            >
              <Input
                label="Nome"
                placeholder="Digite o título do artigo"
                _focusVisible={{ borderColor: "#FFD000" }}
                error={errors.name?.message}
                {...register("name")}
              />
            </Flex>
          </Flex>

          <Flex justify="flex-start" wrap="wrap" w="100%" mb="0.3125rem">
            <Flex
              flex={1}
              direction="column"
              mr={{ base: "0", sm: "1rem" }}
              minW="13.75rem"
            >
              <Text
                fontSize="sm"
                mb="2px"
                alignItems="start"
                color="neutral.500"
              >
                Descrição do artigo
              </Text>
              <Textarea
                resize="none"
                placeholder="Digite a descrição do artigo"
                _focusVisible={{ borderColor: "#FFD000" }}
                {...register("description")}
              />
              {errors.description?.message ? (
                <InputError>{errors.description?.message}</InputError>
              ) : (
                <Box h="1.625rem" />
              )}
            </Flex>
          </Flex>
        </Flex>

        <Flex
          {...getRootProps({ className: "dropzone" })}
          minHeight="5rem"
          borderStyle="dashed"
          _hover={{ cursor: "pointer" }}
          borderWidth="1px"
          borderRadius="lg"
          justify="center"
          align="center"
          mb="1rem"
        >
          <input {...getInputProps()} />
          <Text color="neutral.500">
            {acceptedFilesManager.length === 0
              ? "Arraste e solte o artigo em PDF aqui, ou clique para selecioná-lo"
              : `Arquivo "${acceptedFilesManager[0].name}" selecionado com sucesso :)`}
          </Text>
        </Flex>

        <Flex justify="flex-start" wrap="wrap" w="100%" mb="0.3125rem">
          <Flex
            flex={1}
            direction="column"
            mr={{ base: "0", sm: "1rem" }}
            minW="13.75rem"
          >
            <Text fontSize="sm" mb="2px" alignItems="start" color="neutral.500">
              Evento
            </Text>

            <Select
              theme={(theme) => ({
                ...theme,
                borderRadius: 0,
                colors: {
                  ...theme.colors,
                  text: "orangered",
                  primary25: "#FFD000",
                  primary: "black",
                },
              })}
              defaultValue={selectedEvent}
              onChange={(value) => {
                setSelectedEvent(value as SelectProps);
              }}
              options={events}
              placeholder="Selecione um evento"
              noOptionsMessage={() => "Nenhum evento cadastrado"}
            />

            {!selectedEvent ? (
              <InputError>Selecione um evento</InputError>
            ) : (
              <Box h="1.625rem" />
            )}
          </Flex>
        </Flex>

        <Flex
          w="100%"
          px="1rem"
          align="center"
          justify="flex-end"
          alignItems="center"
          mt="1rem"
        >
          <Button
            h="3.25rem"
            type="submit"
            disabled={isLoading}
            isLoading={isLoading}
            style={{ background: "#FFD000", color: "#000" }}
            title="Criar artigo"
          >
            Criar artigo
          </Button>
        </Flex>
      </Flex>
    </LayoutSigned>
  );
};

export default authRoute(CreateArticle);
