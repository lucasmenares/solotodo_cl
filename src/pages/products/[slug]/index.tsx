import {
  Box,
  Container,
  Divider,
  Grid,
  Stack,
  Typography,
} from "@mui/material";
import { GetServerSideProps } from "next";
import { useState } from "react";
import HeaderBreadcrumbs from "src/components/HeaderBreadcrumbs";
import Image from "src/components/Image";
import Page from "src/components/Page";
import ProductBenchmarks from "src/components/product/ProductBenchmarks";
import ProductRating from "src/components/product/ProductRating";
import ProductRatingSummary from "src/components/product/ProductRatingSummary";
import ProductVariants from "src/components/product/ProductVariants";
import { constants } from "src/config";
import { fetchJson } from "src/frontend-utils/network/utils";
import { useApiResourceObjects } from "src/frontend-utils/redux/api_resources/apiResources";
import { Product } from "src/frontend-utils/types/product";
import { Category } from "src/frontend-utils/types/store";
import { PATH_MAIN } from "src/routes/paths";
import { useAppSelector } from "src/store/hooks";
import ReactDisqusComments from "react-disqus-comments";
import ProductPrices from "src/components/product/ProductPrices";
import ProductDescription from "src/components/product/ProductDescription";

export default function ProductPage({ product }: { product: Product }) {
  const apiResourceObjects = useAppSelector(useApiResourceObjects);
  const [openNewCommentDrawer, setOpenNewCommentDrawer] = useState(false);

  const category = apiResourceObjects[product.category] as Category;

  return (
    <Page title={product.name}>
      <Container maxWidth={false}>
        <HeaderBreadcrumbs
          heading=""
          links={[
            { name: "Home", href: PATH_MAIN.root },
            { name: category.name, href: `${PATH_MAIN.root}${category.slug}` },
            { name: product.name },
          ]}
        />
        <Grid container spacing={3} justifyContent="space-between">
          <Grid item xs={12} md={4}>
            <Box
              sx={{
                borderRadius: 5,
              }}
              bgcolor="#fff"
              padding={1}
            >
              <Image
                alt={product.picture_url}
                src={product.picture_url}
                ratio="1/1"
              />
            </Box>
          </Grid>
          <Grid item xs={12} md={5}>
            <Stack spacing={3}>
              <Typography variant="h2" color="text.extra">{product.name}</Typography>
              <ProductRatingSummary productOrStore={product} />
              <ProductVariants product={product} category={category} />
              <ProductBenchmarks product={product} category={category} />
              <ProductDescription product={product} />
            </Stack>
          </Grid>
          <Grid item xs={12} md={3}>
            <ProductPrices
              product={product}
              category={category}
              setOpenNewCommentDrawer={setOpenNewCommentDrawer}
            />
          </Grid>
        </Grid>
        <Divider variant="fullWidth" sx={{ marginY: 5 }} />
        <ProductRating
          product={product}
          openNewCommentDrawer={openNewCommentDrawer}
          setOpenNewCommentDrawer={setOpenNewCommentDrawer}
        />
        <Divider variant="fullWidth" sx={{ marginY: 5 }} />
        <ReactDisqusComments
          shortname={constants.disqusShortName}
          identifier={product.id.toString()}
          title={product.name}
          url={`https://www.solotodo.com/products/${product.id}`}
        />
      </Container>
    </Page>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  try {
    const initSlug = context.params?.slug as String;
    const [productId, ...givenSlugParts] = initSlug.split("-");
    const slug = givenSlugParts.join("-");
    const product = await fetchJson(
      `${constants.apiResourceEndpoints.products}${productId}/`
    );
    if (slug !== product.slug) {
      return {
        redirect: {
          permanent: false,
          destination: `/products/${product.id}-${product.slug}`,
        },
      };
    }
    return {
      props: {
        product: product,
      },
    };
  } catch {
    return {
      notFound: true,
    };
  }
};
