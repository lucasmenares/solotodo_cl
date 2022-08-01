import {
  Box,
  CircularProgress,
  Container,
} from "@mui/material";
// components
import Page from "src/components/Page";
import BudgetRow from "src/components/budget/BudgetRow";
import HeaderBreadcrumbs from "src/components/HeaderBreadcrumbs";
// types
import { Budget } from "src/components/budget/types";
import { PATH_MAIN } from "src/routes/paths";
import { constants } from "src/config";
import { jwtFetch } from "src/frontend-utils/nextjs/utils";
import { wrapper } from "src/store/store";
import { useEffect, useState } from "react";
import { PricingEntriesProps } from "src/components/product/types";
import useSettings from "src/hooks/useSettings";
import { fetchJson } from "src/frontend-utils/network/utils";
import BudgetEditDesktop from "src/components/budget/BudgetEditDesktop";

export default function BudgetEdit({
  initialBudget,
}: {
  initialBudget: Budget;
}) {
  const { prefExcludeRefurbished, prefStores } = useSettings();
  const [budget, setBudget] = useState(initialBudget);
  const [pricingEntries, setPricingEntries] = useState<
    PricingEntriesProps[] | null
  >(null);

  useEffect(() => {
    if (budget.products_pool.length) {
      let url = "products/available_entities/?";
      for (const product of budget.products_pool) {
        url += `ids=${product.id}&`;
      }

      for (const store of prefStores) {
        url += `&stores=${store}`;
      }

      url += `&exclude_refurbished=${prefExcludeRefurbished}`;

      fetchJson(url).then((response) => {
        const pricingEntries: PricingEntriesProps[] = response.results;
        pricingEntries.sort((a, b) =>
          a.product.name <= b.product.name ? -1 : 1
        );
        setPricingEntries(pricingEntries);
      });
    }
  }, [budget.products_pool, prefExcludeRefurbished, prefStores]);

  console.log(budget);
  console.log(pricingEntries);
  return (
    <Page title="Cotización">
      <Container maxWidth={false}>
        <HeaderBreadcrumbs
          heading=""
          links={[
            { name: "Home", href: PATH_MAIN.root },
            { name: "Cotizaciones", href: `${PATH_MAIN.budgets}/1232939` },
            { name: budget.name },
          ]}
        />
        {pricingEntries === null ? (
          <Box textAlign="center">
            <CircularProgress color="inherit" />
          </Box>
        ) : (
         <BudgetEditDesktop budget={budget} setBudget={setBudget} pricingEntries={pricingEntries} />
        )}
      </Container>
    </Page>
  );
}

export const getServerSideProps = wrapper.getServerSideProps(
  (st) => async (context) => {
    try {
      const budget = await jwtFetch(
        context,
        `${constants.apiResourceEndpoints.budgets}${context.params?.id}/`
      );
      const user = st.getState().user;
      if (!user || (!user.is_superuser && budget.user.id !== user.id)) {
        return {
          redirect: {
            permanent: false,
            destination: "/",
          },
        };
      }
      return {
        props: {
          initialBudget: budget,
        },
      };
    } catch {
      return {
        redirect: {
          permanent: false,
          destination: "/login?budget_sign_in_required=True",
        },
      };
    }
  }
);
