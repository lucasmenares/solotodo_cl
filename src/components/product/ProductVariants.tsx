import { Product } from "src/frontend-utils/types/product";
import { constants } from "src/config";
import { Category } from "src/frontend-utils/types/store";
import { useState } from "react";
import { Entity } from "src/frontend-utils/types/entity";
import { useMemo } from "react";
import { fetchJson } from "src/frontend-utils/network/utils";
import { useAppSelector } from "src/store/hooks";
import { useUser } from "src/frontend-utils/redux/user";
import { useApiResourceObjects } from "src/frontend-utils/redux/api_resources/apiResources";
import { Stack } from "@mui/material";
import ProductAxisChoices from "./ProductAxisChoices";
import { PricingEntriesProps } from "./types";

type ProductVariantsProps = {
  product: Product;
  category: Category;
};

type Bucket = {
  fields: string;
  axes: {
    label: string;
    labelField: string;
    orderingField: string;
  }[];
};

export default function ProductVariants({
  product,
  category,
}: ProductVariantsProps) {
  const user = useAppSelector(useUser);
  const apiResourceObjects = useAppSelector(useApiResourceObjects);
  const [pricingEntries, setPrincingEntries] = useState<PricingEntriesProps[]>(
    []
  );
  const bucketSettings = (constants.bucketCategories as Record<number, Bucket>)[
    category.id
  ];

  // TODO: check variants present for category

  const fields = bucketSettings.fields;
  const bucketUrl = `products/${product.id}/bucket/?fields=${fields}`;

  useMemo(() => {
    const stores = user
      ? user.preferred_stores.map((s) => apiResourceObjects[s])
      : [];

    fetchJson(bucketUrl).then((products) => {
      let pricingEntriesUrl = `products/available_entities/?`;

      for (const product of products) {
        pricingEntriesUrl += `ids=${product.id}&`;
      }

      for (const store of stores) {
        pricingEntriesUrl += `stores=${store.id}&`;
      }

      fetchJson(pricingEntriesUrl).then((response) => {
        const filteredEntries = (response.results as PricingEntriesProps[])
          .map((pricingEntry) => ({
            product: pricingEntry.product,
            entities: pricingEntry.entities.filter(
              (entity: Entity) =>
                entity.active_registry &&
                entity.active_registry.cell_monthly_payment === null
            ),
          }))
          .filter(
            (pricingEntry) =>
              pricingEntry.entities.length ||
              pricingEntry.product.id === product.id
          );
        setPrincingEntries(filteredEntries);
      });
    });
  }, [apiResourceObjects, bucketUrl, product.id, user]);

  if (!bucketSettings || pricingEntries.length === 0) return null;

  const axes = bucketSettings.axes.filter((axis) => {
    return (
      new Set(
        pricingEntries.map(
          (pricingEntry) => pricingEntry.product.specs[axis.labelField]
        )
      ).size > 1
    );
  });

  if (!axes.length) return null;

  const labelFields = bucketSettings.axes.map((axis) => axis.labelField);

  return (
    <Stack spacing={2}>
      {axes.map((axis) => (
        <ProductAxisChoices
          key={axis.label}
          axis={axis}
          product={product}
          pricingEntries={pricingEntries}
          otherLabelFields={labelFields.filter(
            (labelField) => labelField !== axis.labelField
          )}
        />
      ))}
    </Stack>
  );
}
