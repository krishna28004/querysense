import { AnalyzerRule } from './types';
import { nonSargableYearRule } from '../rules/non-sargable-year';
import { nonSargableDateRule } from '../rules/non-sargable-date';
import { nonSargableLowerRule } from '../rules/non-sargable-lower';
import { leadingWildcardRule } from '../rules/leading-wildcard';
import { excessiveOffsetRule } from '../rules/excessive-offset';
import { selectStarRule } from '../rules/select-star';
import { countDistinctRule } from '../rules/count-distinct';
import { unoptimizedHavingRule } from '../rules/unoptimized-having';
import { orChainsRule } from '../rules/or-chains';
import { implicitUnionDistinctRule } from '../rules/implicit-union-distinct';
import { crossJoinRule } from '../rules/cross-join';
import { orderByRandRule } from '../rules/order-by-rand';

export const ruleRegistry: AnalyzerRule[] = [
  nonSargableYearRule,
  nonSargableDateRule,
  nonSargableLowerRule,
  leadingWildcardRule,
  excessiveOffsetRule,
  selectStarRule,
  countDistinctRule,
  unoptimizedHavingRule,
  orChainsRule,
  implicitUnionDistinctRule,
  crossJoinRule,
  orderByRandRule
];
