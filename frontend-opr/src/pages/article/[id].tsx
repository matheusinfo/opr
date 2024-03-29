import Head from "next/head";
import { LayoutSigned } from "@/components/layout";
import {
  Flex,
  useBoolean,
  Text,
  Textarea,
  Divider,
  Button,
} from "@chakra-ui/react";
import { Input } from "@/components/input";
import authRoute from "@/utils/auth";
import fetchData from "utils/fetch";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { base64toBlob } from "@/utils/base-64";
import { useDropzone } from "react-dropzone";
import { useAuth } from "context";
import {
  EventProps,
  UserProps,
  ArticleProps as GlobalArticleProps,
  ArticleReviewProps,
  ArticleReviewerProps as GlobalArticleReviewerProps,
} from "common/types";
import Router from "next/router";

type ArticleReviewerProps = GlobalArticleReviewerProps & {
  reviewer: UserProps;
  articleReview: ArticleReviewProps[];
};

type ArticleProps = GlobalArticleProps & {
  creator: UserProps;
  event: EventProps;
  articleReviewer: ArticleReviewerProps[];
};

type FormattedArticleReviewProps = ArticleReviewProps & {
  reviewerName: string;
};

const LoadArticleById = () => {
  const { user } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useBoolean(true);
  const [article, setArticle] = useState<ArticleProps>();
  const [articleReviews, setArticleReviews] = useState<
    FormattedArticleReviewProps[]
  >([]);
  const [acceptedFilesManager, setAcceptedFilesManager] = useState<File[]>([]);
  const { acceptedFiles, getRootProps, getInputProps } = useDropzone({
    accept: "application/pdf",
  });

  useEffect(() => {
    setAcceptedFilesManager(acceptedFiles);
  }, [acceptedFiles, acceptedFiles.length]);

  useEffect(() => {
    (async () => {
      if (router.query.id) {
        try {
          const apiResponse = await fetchData(
            "GET",
            `article/${router.query.id}`
          );

          const apiArticleReviews = apiResponse.articleReviewer.map(
            (articleReview: ArticleReviewerProps) => {
              const reviewerName = articleReview.reviewer.name;

              return {
                articleReview: articleReview.articleReview.map((review) => ({
                  reviewerName,
                  comments: review.comments,
                  file: review.file,
                  createdAt: review.createdAt,
                  id: review.id,
                  originalFile: review.originalFile,
                })),
              };
            }
          );

          const formattedReviews = apiArticleReviews
            .map((review: ArticleReviewerProps) => review.articleReview)
            .flat(Infinity);

          setArticle(apiResponse);
          setArticleReviews(formattedReviews);
        } catch (error) {
          toast.error("Ocorreu um erro ao buscar o artigo, tente novamente!", {
            autoClose: 5000,
          });
        } finally {
          setIsLoading.off();
        }
      }
    })();
  }, [router.query.id, setIsLoading]);

  const handlePrintPdf = () => {
    const url = base64toBlob(article?.file as string);
    window.open(URL.createObjectURL(url));
  };

  const handleDonwloadPdf = () => {
    const url = window.URL.createObjectURL(
      base64toBlob(article?.file as string)
    );
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `${article?.name}.pdf`);
    document.body.appendChild(link);
    link.click();
  };

  const handleReviewerPdf = (file: string) => {
    const url = base64toBlob(file);
    window.open(URL.createObjectURL(url));
  };

  const handleUpdateArticle = async () => {
    try {
      if (!acceptedFilesManager[0]) {
        toast.error("O arquivo é obrigatório para atualização!", {
          autoClose: 5000,
        });
        return;
      }

      let reader = new FileReader();
      reader.readAsDataURL(acceptedFilesManager[0]);

      reader.onload = async () => {
        const fileResult = reader.result as string;

        await fetchData("PUT", `article/${article?.id}`, {
          file: fileResult.replace("data:application/pdf;base64,", ""),
        });

        toast.success("Artigo atualizado com sucesso!", {
          autoClose: 5000,
        });

        Router.reload();
      };
    } catch {
      toast.error("Ocorreu ao atualizar o artigo, tente novamente!", {
        autoClose: 5000,
      });
    }
  };

  return (
    <LayoutSigned>
      <Head>
        <title>Artigo</title>
        <meta name="viewport" content="initial-scale=1.0, width=device-width" />
      </Head>

      {isLoading ? (
        <Flex flexDirection="column" align="center" justify="center">
          <Text
            width="100%"
            textAlign="center"
            margin="1rem 0 3rem 0"
            fontSize="1.5rem"
            fontWeight="bold"
          >
            Carregando...
          </Text>
        </Flex>
      ) : (
        <Flex as="form" width="80%" padding="1rem" direction="column">
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
                  name="title"
                  label="Títutlo"
                  _focusVisible={{ borderColor: "#FFD000" }}
                  defaultValue={article?.name}
                  readOnly
                  disabled
                />
              </Flex>

              <Flex
                flex={1}
                direction="column"
                mr={{ base: "0", sm: "1rem" }}
                minW="13.75rem"
              >
                <Input
                  name="event_name"
                  label="Evento submetido"
                  defaultValue={article?.event?.name}
                  _focusVisible={{ borderColor: "#FFD000" }}
                  readOnly
                  disabled
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
                  _focusVisible={{ borderColor: "#FFD000" }}
                  defaultValue={article?.description}
                  readOnly
                  disabled
                />
              </Flex>
            </Flex>

            {article?.creator?.id === user.id && (
              <>
                <Text
                  fontSize="sm"
                  mb="2px"
                  mt="1rem"
                  alignItems="start"
                  color="neutral.500"
                >
                  Nova submissão de artigo
                </Text>
                <Flex justify="flex-start" wrap="wrap" w="100%" mb="0.3125rem">
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
                    w="100%"
                  >
                    <input {...getInputProps()} />
                    <Text color="neutral.500">
                      {acceptedFilesManager.length === 0
                        ? "Arraste e solte o artigo em PDF aqui, ou clique para selecioná-lo"
                        : `Arquivo "${acceptedFilesManager[0].name}" selecionado com sucesso :)`}
                    </Text>
                  </Flex>
                </Flex>
              </>
            )}

            <Flex justify="flex-start" wrap="wrap" w="100%" mt="1rem">
              <Flex
                flex={1}
                direction="column"
                mr={{ base: "0", sm: "1rem" }}
                minW="13.75rem"
              >
                <Button
                  style={{ background: "#FFD000", color: "#000" }}
                  title="Visualizar artigo"
                  onClick={handlePrintPdf}
                >
                  Visualizar artigo
                </Button>
              </Flex>

              <Flex
                flex={1}
                direction="column"
                mr={{ base: "0", sm: "1rem" }}
                minW="13.75rem"
              >
                <Button
                  style={{ background: "#FFD000", color: "#000" }}
                  title="Baixar artigo"
                  onClick={handleDonwloadPdf}
                >
                  Baixar artigo
                </Button>
              </Flex>

              {user.id === article?.creator?.id && (
                <Flex
                  flex={1}
                  direction="column"
                  mr={{ base: "0", sm: "1rem" }}
                  minW="13.75rem"
                >
                  <Button
                    style={{ background: "#FFD000", color: "#000" }}
                    title="Atualizar artigo"
                    onClick={handleUpdateArticle}
                  >
                    Atualizar artigo
                  </Button>
                </Flex>
              )}
            </Flex>

            <Divider mt="3rem" />

            <Text
              width="100%"
              textAlign="center"
              margin="1rem 0 3rem 0"
              fontSize="1.5rem"
              fontWeight="bold"
            >
              Autor do artigo
            </Text>

            <Flex justify="flex-start" wrap="wrap" w="100%" mb="0.3125rem">
              <Flex
                flex={1}
                direction="column"
                mr={{ base: "0", sm: "1rem" }}
                minW="13.75rem"
              >
                <Input
                  name="name"
                  label="Nome"
                  _focusVisible={{ borderColor: "#FFD000" }}
                  defaultValue={article?.creator?.name}
                  readOnly
                  disabled
                />
              </Flex>

              <Flex
                flex={1}
                direction="column"
                mr={{ base: "0", sm: "1rem" }}
                minW="13.75rem"
              >
                <Input
                  name="email"
                  label="E-mail"
                  defaultValue={article?.creator?.email}
                  _focusVisible={{ borderColor: "#FFD000" }}
                  readOnly
                  disabled
                />
              </Flex>
            </Flex>

            <Divider mt="1rem" />

            <Text
              width="100%"
              textAlign="center"
              margin="1rem 0 3rem 0"
              fontSize="1.5rem"
              fontWeight="bold"
            >
              Revisores do artigo
            </Text>

            <Flex justify="flex-start" wrap="wrap" w="100%" mb="0.3125rem">
              {article?.articleReviewer?.length ? (
                article?.articleReviewer.map((reviewer) => (
                  <Flex
                    justify="flex-start"
                    wrap="wrap"
                    w="100%"
                    mb="0.3125rem"
                    key={reviewer.id}
                  >
                    <Flex
                      flex={1}
                      direction="column"
                      mr={{ base: "0", sm: "1rem" }}
                      minW="13.75rem"
                    >
                      <Input
                        name="name"
                        label="Nome"
                        _focusVisible={{ borderColor: "#FFD000" }}
                        defaultValue={reviewer.reviewer.name}
                        readOnly
                        disabled
                      />
                    </Flex>

                    <Flex
                      flex={1}
                      direction="column"
                      mr={{ base: "0", sm: "1rem" }}
                      minW="13.75rem"
                    >
                      <Input
                        name="e-mail"
                        label="E-mail"
                        defaultValue={reviewer.reviewer.email}
                        _focusVisible={{ borderColor: "#FFD000" }}
                        readOnly
                        disabled
                      />
                    </Flex>
                  </Flex>
                ))
              ) : (
                <Text textAlign="center" width="100%" color="#696969">
                  Nenhum revisor para o artigo :(
                </Text>
              )}
            </Flex>

            <Divider mt="3rem" />

            <Text
              width="100%"
              textAlign="center"
              margin="1rem 0 3rem 0"
              fontSize="1.5rem"
              fontWeight="bold"
            >
              Revisões do artigo
            </Text>

            <Flex justify="flex-start" wrap="wrap" w="100%" mb="0.3125rem">
              {articleReviews.length ? (
                articleReviews
                  .sort((first, second) => second.id - first.id)
                  .map((reviewer) => (
                    <Flex
                      justify="flex-start"
                      wrap="wrap"
                      w="100%"
                      mb="0.3125rem"
                      key={reviewer.id}
                      min-height="8rem"
                    >
                      <Flex
                        flex={0.3}
                        direction="column"
                        mr={{ base: "0", sm: "1rem" }}
                        minW="13.75rem"
                      >
                        <Input
                          name="name"
                          label="Revisor"
                          _focusVisible={{ borderColor: "#FFD000" }}
                          defaultValue={reviewer.reviewerName}
                          readOnly
                          disabled
                        />
                      </Flex>

                      <Flex
                        flex={0.3}
                        direction="column"
                        mr={{ base: "0", sm: "1rem" }}
                        minW="13.75rem"
                      >
                        <Input
                          name="date"
                          label="Data da revisão"
                          _focusVisible={{ borderColor: "#FFD000" }}
                          defaultValue={reviewer.createdAt.split("T")[0]}
                          readOnly
                          disabled
                        />
                      </Flex>

                      <Flex
                        flex={0.3}
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
                          Comentários do revisor
                        </Text>
                        <Textarea
                          resize="none"
                          name="comments"
                          defaultValue={reviewer.comments}
                          _focusVisible={{ borderColor: "#FFD000" }}
                          readOnly
                        />
                      </Flex>

                      <Flex
                        flex={0.1}
                        direction="column"
                        mr={{ base: "0", sm: "1rem" }}
                        minW="13.75rem"
                        alignItems="center"
                        justifyContent="center"
                      >
                        <Button
                          style={{ background: "#FFD000", color: "#000" }}
                          title="Visualizar revisão"
                          onClick={() =>
                            handleReviewerPdf(reviewer.originalFile)
                          }
                          disabled={!reviewer.originalFile}
                        >
                          Visualizar artigo original
                        </Button>
                      </Flex>

                      <Flex
                        flex={0.1}
                        direction="column"
                        mr={{ base: "0", sm: "1rem" }}
                        minW="13.75rem"
                        alignItems="center"
                        justifyContent="center"
                      >
                        <Button
                          style={{ background: "#FFD000", color: "#000" }}
                          title="Visualizar revisão"
                          onClick={() => handleReviewerPdf(reviewer.file)}
                          disabled={!reviewer.file}
                        >
                          Visualizar revisão
                        </Button>
                      </Flex>
                    </Flex>
                  ))
              ) : (
                <Text textAlign="center" width="100%" color="#696969">
                  Nenhuma revisão recebida :(
                </Text>
              )}
            </Flex>
          </Flex>
        </Flex>
      )}
    </LayoutSigned>
  );
};

export default authRoute(LoadArticleById);

